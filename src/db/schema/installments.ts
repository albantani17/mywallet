import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { debts } from "./debts";

/**
 * One concrete obligation: "pay 500.000 on 10 August".
 *
 * These rows are materialised once by the generator and then stand on their
 * own. Interest is frozen into `interestAmount` at that moment rather than
 * recomputed, for three reasons: the user has an official schedule from the
 * lender and will trust it over ours; the last installment almost always
 * differs because of rounding; and a floating rate must not rewrite what was
 * already paid last year.
 *
 * There is no `paid_amount` column. How much has landed on a row is summed
 * from `payment_allocations` — a cache would need maintaining on every payment
 * insert, delete and edit, and a stale one is exactly the bug this module
 * cannot afford.
 */
export const installments = sqliteTable(
  "installments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    debtId: integer("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),

    sequence: integer("sequence").notNull(),
    /** Null for an `open` schedule — a debt with no deadline at all. */
    dueDate: integer("due_date", { mode: "timestamp" }),
    /**
     * What the generator first produced, never rewritten. Keeping it lets the
     * detail screen say "moved from 10 Aug" after a reschedule.
     */
    originalDueDate: integer("original_due_date", { mode: "timestamp" }),

    principalAmount: integer("principal_amount").notNull().default(0),
    interestAmount: integer("interest_amount").notNull().default(0),
    feeAmount: integer("fee_amount").notNull().default(0),
    penaltyAmount: integer("penalty_amount").notNull().default(0),
    /**
     * The billed figure, penalty included. Every derived expression reads this
     * one column, so none of them can forget an addend.
     */
    totalAmount: integer("total_amount").notNull(),

    /** True once the user edited the row: the generator must not overwrite it. */
    isModified: integer("is_modified", { mode: "boolean" })
      .notNull()
      .default(false),
    note: text("note"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("installment_debt_sequence_idx").on(t.debtId, t.sequence),
    index("installment_due_idx").on(t.dueDate),

    check("positive_sequence", sql`${t.sequence} >= 1`),
    check("non_negative_installment_total", sql`${t.totalAmount} >= 0`),
  ],
);

export type InstallmentRow = typeof installments.$inferSelect;
export type InstallmentInsertRow = typeof installments.$inferInsert;
