import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { installments } from "./installments";
import { payments } from "./payments";

/**
 * The bridge between a payment and the installments it covers: "500rb of this
 * transfer went to July, 500rb to August".
 *
 * Summing these is the only definition of how much an installment has been
 * paid, and therefore of whether it is settled. There is no `is_paid` flag
 * anywhere, and no allocation row for overpayment either — money a payment
 * could not place stays visible as `payment.amount - SUM(allocations)`, which
 * the pay form surfaces rather than swallowing.
 */
export const paymentAllocations = sqliteTable(
  "payment_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    installmentId: integer("installment_id")
      .notNull()
      .references(() => installments.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // One payment touches a given installment at most once; splitting it would
    // only make the sums harder to read.
    uniqueIndex("payment_allocation_pair_idx").on(t.paymentId, t.installmentId),
    index("payment_allocation_installment_idx").on(t.installmentId),

    check("positive_allocation_amount", sql`${t.amount} > 0`),
  ],
);

export type PaymentAllocationRow = typeof paymentAllocations.$inferSelect;
export type PaymentAllocationInsertRow =
  typeof paymentAllocations.$inferInsert;
