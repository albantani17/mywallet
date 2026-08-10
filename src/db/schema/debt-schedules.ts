import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { debts } from "./debts";

export const SCHEDULE_TYPES = [
  "open",
  "single",
  "recurring",
  "custom",
] as const;
export const INTERVAL_UNITS = ["day", "week", "month"] as const;

/**
 * The rule that produced a debt's installments — one row per debt.
 *
 * Product names (Shopee Paylater, KTA) are deliberately absent: they are
 * presets that fill this form in, not branches in the code. Every financial
 * product reduces to one of the four `schedule_type` values, so a new one
 * needs no new logic.
 *
 * This is the recipe, not the result. The generator reads it once to write
 * concrete `installments` rows; nothing recomputes a due date from here
 * afterwards, or a restructure would be erased on every screen open.
 */
export const debtSchedules = sqliteTable(
  "debt_schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    debtId: integer("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),

    scheduleType: text("schedule_type", { enum: SCHEDULE_TYPES }).notNull(),
    /** Where counting starts. Null for `open`. */
    anchorDate: integer("anchor_date", { mode: "timestamp" }),
    /**
     * The day of month the user actually meant, e.g. 31 — never the clamped
     * result. February clamps to 28, but March has to return to 31, and that
     * is only possible if the original intent survives.
     */
    dueDay: integer("due_day"),
    intervalUnit: text("interval_unit", { enum: INTERVAL_UNITS }),
    intervalCount: integer("interval_count"),
    /** How many installments. Null for `open`. */
    periodCount: integer("period_count"),
    /** How late a payment may be before the row counts as overdue. */
    graceDays: integer("grace_days").notNull().default(0),
    /** How many days ahead of the due date to start reminding. */
    reminderDays: integer("reminder_days").notNull().default(3),
    /** Rounding step for installments 1..n-1, in minor units. */
    roundingUnit: integer("rounding_unit").notNull().default(1000),
    /**
     * The exact instalment the user copied off the lender's screen, in minor
     * units. When set, the generator builds rows of this amount and derives the
     * interest from them instead of charging it from a rate — see
     * splitFixedAmounts. Null on every schedule entered the old way.
     */
    installmentAmount: integer("installment_amount"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // What enforces the 1:1 with debts.
    uniqueIndex("debt_schedule_debt_idx").on(t.debtId),

    check(
      "valid_due_day",
      sql`${t.dueDay} IS NULL OR (${t.dueDay} BETWEEN 1 AND 31)`,
    ),
    check("positive_rounding_unit", sql`${t.roundingUnit} >= 1`),
    // A recurring schedule the generator cannot read is worse than no
    // schedule, so the shape is enforced in SQL rather than only in zod.
    check(
      "recurring_shape",
      sql`${t.scheduleType} != 'recurring'
        OR (${t.anchorDate} IS NOT NULL AND ${t.intervalUnit} IS NOT NULL
            AND ${t.intervalCount} >= 1 AND ${t.periodCount} >= 1)`,
    ),
    check(
      "single_shape",
      sql`${t.scheduleType} != 'single' OR ${t.anchorDate} IS NOT NULL`,
    ),
  ],
);

export type DebtScheduleRow = typeof debtSchedules.$inferSelect;
export type DebtScheduleInsertRow = typeof debtSchedules.$inferInsert;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];
