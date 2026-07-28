import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../client";
import { transactions } from "../schema/transactions";
import { wallets } from "../schema/wallets";
import type {
  Wallet,
  WalletInsert,
  WalletUpdate,
} from "../validators/wallet.validator";

export type WalletWithBalance = Wallet & {
  balance: number;
  /** Transactions on either side of this wallet, transfers included. */
  transactionCount: number;
  /** Debts pointing at this wallet — also blocks a row delete. */
  debtCount: number;
};

/**
 * Current balance = opening balance, plus everything that landed in the wallet,
 * minus everything that left it (transfers out and their fees included).
 * Expressed as correlated subqueries so the whole list costs one round trip.
 *
 * The identifiers are written out literally instead of interpolating
 * `${wallets.id}` / `${transactions.walletId}`. Drizzle strips table
 * qualifiers from interpolated columns inside a SELECT list, which turned
 * `transactions.wallet_id = wallets.id` into `"wallet_id" = "id"` — and since
 * `transactions` has both columns, the subquery stopped correlating to the
 * outer wallet and every wallet inherited other wallets' transactions.
 */
const balanceExpression = sql<number>`
  "wallets"."initial_balance"
  + COALESCE((
      SELECT SUM(CASE "transactions"."type"
                   WHEN 'income' THEN "transactions"."amount"
                   ELSE -"transactions"."amount"
                 END) - SUM("transactions"."fee")
      FROM "transactions"
      WHERE "transactions"."wallet_id" = "wallets"."id"
    ), 0)
  + COALESCE((
      SELECT SUM("transactions"."amount")
      FROM "transactions"
      WHERE "transactions"."to_wallet_id" = "wallets"."id"
        AND "transactions"."type" = 'transfer'
    ), 0)
`;

/**
 * How much history a wallet carries. Drives two rules: a used wallet can only
 * have its name edited, and it must be archived rather than row-deleted (the
 * foreign keys are ON DELETE no action, so a delete would simply fail).
 *
 * Identifiers are literal here for the same reason as balanceExpression above.
 */
const transactionCountExpression = sql<number>`
  (SELECT COUNT(*) FROM "transactions"
    WHERE "transactions"."wallet_id" = "wallets"."id"
       OR "transactions"."to_wallet_id" = "wallets"."id")
`;

const debtCountExpression = sql<number>`
  (SELECT COUNT(*) FROM "debts" WHERE "debts"."wallet_id" = "wallets"."id")
`;

const walletWithBalanceColumns = {
  id: wallets.id,
  name: wallets.name,
  type: wallets.type,
  initialBalance: wallets.initialBalance,
  currency: wallets.currency,
  icon: wallets.icon,
  color: wallets.color,
  isArchived: wallets.isArchived,
  sortOrder: wallets.sortOrder,
  createdAt: wallets.createdAt,
  updatedAt: wallets.updatedAt,
  balance: balanceExpression,
  transactionCount: transactionCountExpression,
  debtCount: debtCountExpression,
};

/**
 * Select builders, not promises. drizzle's useLiveQuery needs the builder
 * itself to subscribe to table changes — an awaited result cannot re-run. The
 * async repository methods below delegate here so the SQL has one definition.
 */
export const walletQueries = {
  list: ({ includeArchived = false } = {}) =>
    db
      .select()
      .from(wallets)
      .where(includeArchived ? undefined : eq(wallets.isArchived, false))
      .orderBy(asc(wallets.sortOrder)),

  listWithBalances: ({ includeArchived = false } = {}) =>
    db
      .select(walletWithBalanceColumns)
      .from(wallets)
      .where(includeArchived ? undefined : eq(wallets.isArchived, false))
      .orderBy(asc(wallets.sortOrder)),

  /** Richest wallets first — what the dashboard carousel shows. */
  topByBalance: (limit = 3) =>
    db
      .select(walletWithBalanceColumns)
      .from(wallets)
      .where(eq(wallets.isArchived, false))
      .orderBy(desc(balanceExpression))
      .limit(limit),
};

export const walletRepository = {
  async list({ includeArchived = false } = {}): Promise<Wallet[]> {
    return walletQueries.list({ includeArchived });
  },

  /** Wallets with their derived current balance, in display order. */
  async listWithBalances({
    includeArchived = false,
  } = {}): Promise<WalletWithBalance[]> {
    return walletQueries.listWithBalances({ includeArchived });
  },

  async topByBalance(limit = 3): Promise<WalletWithBalance[]> {
    return walletQueries.topByBalance(limit);
  },

  async getById(id: number): Promise<Wallet | null> {
    const rows = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async getBalance(id: number): Promise<number> {
    const rows = await db
      .select({ balance: balanceExpression })
      .from(wallets)
      .where(eq(wallets.id, id))
      .limit(1);
    return rows[0]?.balance ?? 0;
  },

  /** Sum of every active wallet's balance — the dashboard's total assets. */
  async getTotalAssets(): Promise<number> {
    const rows = await db
      .select({ balance: balanceExpression })
      .from(wallets)
      .where(eq(wallets.isArchived, false));
    return rows.reduce((total, row) => total + Number(row.balance), 0);
  },

  async create(data: WalletInsert): Promise<Wallet> {
    const [row] = await db.insert(wallets).values(data).returning();
    return row;
  },

  async update(id: number, data: WalletUpdate): Promise<Wallet | null> {
    const [row] = await db
      .update(wallets)
      .set(data)
      .where(eq(wallets.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Wallets are archived rather than deleted: transactions reference them, so
   * removing a wallet would orphan history.
   */
  async archive(id: number): Promise<Wallet | null> {
    return walletRepository.update(id, { isArchived: true });
  },

  async unarchive(id: number): Promise<Wallet | null> {
    return walletRepository.update(id, { isArchived: false });
  },

  /**
   * Hard delete. Only safe for a wallet with no transactions and no debts —
   * the foreign keys are ON DELETE no action, so SQLite rejects anything else.
   * Go through walletService.removeWallet, which picks delete vs archive.
   */
  async remove(id: number): Promise<void> {
    await db.delete(wallets).where(eq(wallets.id, id));
  },
};
