import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { categories } from "./categories";
import { debts } from "./debts";
import { wallets } from "./wallets";

export const TRANSACTION_TYPES = [
  "income",
  "expense",
  "transfer",
  "bill",
] as const;

/**
 * Every movement of money. `amount` is always positive and stored in minor
 * units — direction is carried by `type`, never by the sign. A transfer moves
 * `amount` from `walletId` to `toWalletId` and additionally costs `fee` on the
 * source wallet.
 *
 * A `bill` is an expense that also carries a `dueDate`; it leaves the wallet
 * the moment it is recorded, exactly like an `expense`. The column is stored
 * as plain text with no CHECK, so the enum above is a TypeScript-only
 * constraint — adding a member needs no data migration.
 */
export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    amount: integer("amount").notNull(),
    walletId: integer("wallet_id")
      .notNull()
      .references(() => wallets.id),
    toWalletId: integer("to_wallet_id").references(() => wallets.id),
    categoryId: integer("category_id").references(() => categories.id),
    debtId: integer("debt_id").references(() => debts.id),
    fee: integer("fee").notNull().default(0),
    note: text("note"),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    /** Bills only — when the money was owed, as opposed to when it moved. */
    dueDate: integer("due_date", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("tx_wallet_idx").on(t.walletId),
    index("tx_to_wallet_idx").on(t.toWalletId),
    index("tx_date_idx").on(t.occurredAt),
    index("tx_debt_idx").on(t.debtId),

    check("positive_amount", sql`${t.amount} > 0`),
    check("non_negative_fee", sql`${t.fee} >= 0`),
    check(
      "no_self_transfer",
      sql`${t.toWalletId} IS NULL OR ${t.walletId} != ${t.toWalletId}`,
    ),
    // A transfer must name a destination and carry no category; anything else
    // must not name a destination.
    check(
      "transfer_shape",
      sql`(${t.type} = 'transfer' AND ${t.toWalletId} IS NOT NULL AND ${t.categoryId} IS NULL)
        OR (${t.type} != 'transfer' AND ${t.toWalletId} IS NULL)`,
    ),
  ],
);

export type TransactionRow = typeof transactions.$inferSelect;
export type TransactionInsertRow = typeof transactions.$inferInsert;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
