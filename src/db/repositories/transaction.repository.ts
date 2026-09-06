import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  like,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db, type Executor } from "../client";
import { categories } from "../schema/categories";
import {
  transactions,
  type TransactionType,
} from "../schema/transactions";
import { wallets } from "../schema/wallets";
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
} from "../validators/transaction.validator";

export type FrequentTransactionOptions = {
  /** Only transactions on or after this moment count towards a habit. */
  since: Date;
  limit?: number;
};

/**
 * One repeatable transaction: a shape that has been recorded before, with
 * everything a chip needs to render itself and everything a write needs to
 * repeat it.
 */
export type FrequentTransaction = {
  type: TransactionType;
  amount: number;
  walletId: number;
  categoryId: number | null;
  note: string | null;
  walletName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  categoryIsBuiltIn: boolean | null;
};

/** Habits older than this stop being suggestions. */
export const FREQUENT_WINDOW_DAYS = 60;

export type TransactionListOptions = {
  /** Matches transactions where the wallet is either the source or the target. */
  walletId?: number;
  categoryId?: number;
  debtId?: number;
  from?: Date;
  to?: Date;
  /** Free text matched against the note and the wallet name. */
  search?: string;
  limit?: number;
  offset?: number;
};

// Second reference to `wallets` so a transfer's destination can be joined
// alongside its source in one query.
const targetWallets = alias(wallets, "target_wallets");

function buildFilters(options: TransactionListOptions): SQL | undefined {
  const filters: SQL[] = [];

  if (options.walletId !== undefined) {
    filters.push(
      or(
        eq(transactions.walletId, options.walletId),
        eq(transactions.toWalletId, options.walletId),
      )!,
    );
  }
  if (options.categoryId !== undefined) {
    filters.push(eq(transactions.categoryId, options.categoryId));
  }
  if (options.debtId !== undefined) {
    filters.push(eq(transactions.debtId, options.debtId));
  }
  if (options.from) filters.push(gte(transactions.occurredAt, options.from));
  if (options.to) filters.push(lte(transactions.occurredAt, options.to));

  const needle = options.search?.trim();
  if (needle) {
    // Note and wallet name only. The category is deliberately left out: a
    // built-in category renders a translated label (BUILT_IN_LABEL_KEYS in
    // transaction-category.ts) rather than categories.name, so matching the
    // stored name would miss exactly the words the user can see.
    //
    // LIKE is case-insensitive for ASCII in SQLite, so no lower() is needed.
    const pattern = `%${needle}%`;
    filters.push(
      or(like(transactions.note, pattern), like(wallets.name, pattern))!,
    );
  }

  return filters.length ? and(...filters) : undefined;
}

/**
 * Select builders for useLiveQuery — see the note in wallet.repository.ts.
 */
export const transactionQueries = {
  list: (options: TransactionListOptions = {}) => {
    const { limit = 50, offset = 0 } = options;

    return db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        walletId: transactions.walletId,
        toWalletId: transactions.toWalletId,
        categoryId: transactions.categoryId,
        debtId: transactions.debtId,
        fee: transactions.fee,
        note: transactions.note,
        occurredAt: transactions.occurredAt,
        dueDate: transactions.dueDate,
        createdAt: transactions.createdAt,
        walletName: wallets.name,
        walletCurrency: wallets.currency,
        toWalletName: targetWallets.name,
        categoryName: categories.name,
        // A list row draws the category the same way the pickers do — tinted
        // glyph plus a label that stays translated for the built-ins, which is
        // what the slug is for.
        categorySlug: categories.slug,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        categoryIsBuiltIn: categories.isBuiltIn,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(targetWallets, eq(transactions.toWalletId, targetWallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(buildFilters(options))
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(limit)
      .offset(offset);
  },

  /**
   * The wallet behind each of the most recent transactions, newest first.
   *
   * Deliberately plain rows rather than a COALESCE over "most recent per type"
   * subqueries: drizzle decorrelates a correlated subquery written inside
   * .select(), so that shape would silently return the wrong wallet. Walking
   * the rows in TypeScript keeps the fallback chain visible instead.
   */
  /**
   * The shapes recorded most often lately, for one-tap repeating.
   *
   * The amount is part of the identity on purpose: "Kopi 25rb" and "Kopi 30rb"
   * are two suggestions, because a chip whose amount still has to be edited is
   * no faster than the form it replaces.
   *
   * There is no `HAVING count(*) >= 2`. Ordering by uses and then recency
   * already sinks one-off rows below real habits, so a new user still gets
   * useful shortcuts from their handful of transactions instead of an empty
   * strip, and no separate top-up query is needed.
   *
   * Transfers are excluded: transfer_shape needs a destination wallet, and a
   * repeated transfer is rare enough not to earn the extra column.
   */
  frequent: ({ since, limit = 6 }: FrequentTransactionOptions) =>
    db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        walletId: transactions.walletId,
        categoryId: transactions.categoryId,
        note: transactions.note,
        walletName: wallets.name,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        categoryIsBuiltIn: categories.isBuiltIn,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.occurredAt, since),
          inArray(transactions.type, ["expense", "income", "bill"]),
          // Debt cash flow is excluded even though it is repetitive. Repeating
          // one would insert a repayment-shaped transaction with no payment
          // allocation behind it, so the debt module and the transaction list
          // would start disagreeing about what is still owed.
          isNull(transactions.debtId),
        ),
      )
      // Identifiers are spelled out rather than interpolated from the drizzle
      // columns: interpolation drops the table qualifier, and these fragments
      // sit in a three-table join. `note` is normalised so "Kopi" and "kopi "
      // are one habit rather than two chips.
      .groupBy(
        transactions.type,
        transactions.amount,
        transactions.walletId,
        transactions.categoryId,
        sql`lower(trim(coalesce(transactions.note, '')))`,
      )
      .orderBy(
        sql`count(*) desc`,
        sql`max(transactions.occurred_at) desc`,
      )
      .limit(limit),

  recentWallets: (limit = 30) =>
    db
      .select({ type: transactions.type, walletId: transactions.walletId })
      .from(transactions)
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(limit),
};

export const transactionRepository = {
  /** Newest first, joined with the names needed to render a list row. */
  async list(
    options: TransactionListOptions = {},
  ): Promise<TransactionWithRelations[]> {
    return transactionQueries.list(options);
  },

  async getById(id: number): Promise<Transaction | null> {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * A transfer is a single row (source, destination and fee all live on it),
   * so no multi-statement transaction is needed. The transfer_shape check
   * constraint rejects malformed input at the database level.
   */
  async create(data: TransactionInsert): Promise<Transaction> {
    const [row] = await db.insert(transactions).values(data).returning();
    return row;
  },

  async update(id: number, data: TransactionUpdate): Promise<Transaction | null> {
    const [row] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    return row ?? null;
  },

  async remove(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    insert: (data: TransactionInsert, exec: Executor = db): Transaction => {
      const [row] = exec.insert(transactions).values(data).returning().all();
      return row;
    },

    remove: (id: number, exec: Executor = db): void => {
      exec.delete(transactions).where(eq(transactions.id, id)).run();
    },
  },
};
