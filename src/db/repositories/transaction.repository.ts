import { and, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../client";
import { categories } from "../schema/categories";
import { transactions } from "../schema/transactions";
import { wallets } from "../schema/wallets";
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
} from "../validators/transaction.validator";

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

export type MonthlySummary = {
  income: number;
  expense: number;
  net: number;
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

  /**
   * Income and expense totals for a calendar month. Transfers are excluded:
   * moving money between your own wallets is not spending.
   */
  async getMonthlySummary(month: Date): Promise<MonthlySummary> {
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

    const rows = await db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        // A bill is an expense that happens to carry a due date, so it belongs
        // on the same side of the summary.
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} IN ('expense', 'bill') THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to),
        ),
      );

    const income = Number(rows[0]?.income ?? 0);
    const expense = Number(rows[0]?.expense ?? 0);
    return { income, expense, net: income - expense };
  },
};
