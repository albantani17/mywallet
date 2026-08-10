import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { debts } from "./debts";
import { transactions } from "./transactions";
import { wallets } from "./wallets";

export const PAYMENT_METHODS = [
  "transfer",
  "cash",
  "autodebit",
  "other",
] as const;

/**
 * A repayment that actually happened: "transferred 1jt from BCA on 9 August".
 *
 * A payment is an event, kept separate from the obligations it settles. Which
 * installments it covers is `payment_allocations`, because one transfer can
 * close several months and one month can take several transfers — neither of
 * which a boolean on the installment could express.
 */
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    debtId: integer("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),
    walletId: integer("wallet_id").references(() => wallets.id),
    /**
     * The cash-flow row this payment produced, when the user asked for one.
     * Null means the money moved outside the app. Holding the link here is
     * what stops the same repayment being counted twice.
     */
    transactionId: integer("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),

    paidAt: integer("paid_at", { mode: "timestamp" }).notNull(),
    amount: integer("amount").notNull(),
    method: text("method", { enum: PAYMENT_METHODS }),
    /** Transfer reference number, optional. */
    reference: text("reference"),
    note: text("note"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("payment_debt_idx").on(t.debtId, t.paidAt),
    index("payment_transaction_idx").on(t.transactionId),

    check("positive_payment_amount", sql`${t.amount} > 0`),
  ],
);

export type PaymentRow = typeof payments.$inferSelect;
export type PaymentInsertRow = typeof payments.$inferInsert;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
