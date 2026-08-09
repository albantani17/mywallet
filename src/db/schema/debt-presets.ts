import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { COUNTERPARTY_KINDS } from "./counterparties";
import { INTERVAL_UNITS, SCHEDULE_TYPES } from "./debt-schedules";
import { DEBT_DIRECTIONS, INTEREST_METHODS } from "./debts";

/**
 * A financial product the user can start from: Shopee Paylater, a bank KTA,
 * a loan from a friend.
 *
 * A preset only fills the form in. It is not a rule and nothing branches on
 * it — pick one and every field it touched stays editable, because the day a
 * lender changes its tenor the app should need a row edited, not a release.
 *
 * Shaped like wallet_categories on purpose (unique `slug`, `isBuiltIn`,
 * `sortOrder`) so the same idempotent ensureBuiltIns() + onConflictDoNothing
 * seeding pattern applies.
 */
export const debtPresets = sqliteTable(
  "debt_presets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    /** Fallback label; built-in rows are translated via `debts.presets.<slug>`. */
    name: text("name").notNull(),

    kind: text("kind", { enum: COUNTERPARTY_KINDS })
      .notNull()
      .default("institution"),
    direction: text("direction", { enum: DEBT_DIRECTIONS })
      .notNull()
      .default("payable"),

    scheduleType: text("schedule_type", { enum: SCHEDULE_TYPES }).notNull(),
    intervalUnit: text("interval_unit", { enum: INTERVAL_UNITS }),
    intervalCount: integer("interval_count"),
    periodCount: integer("period_count"),

    /** Per period, in basis points — 1%/month is 100. */
    interestRateBps: integer("interest_rate_bps").notNull().default(0),
    interestMethod: text("interest_method", { enum: INTEREST_METHODS })
      .notNull()
      .default("none"),

    dueDay: integer("due_day"),
    graceDays: integer("grace_days").notNull().default(0),
    reminderDays: integer("reminder_days").notNull().default(3),
    roundingUnit: integer("rounding_unit").notNull().default(1000),

    /** Ionicons glyph name. */
    icon: text("icon"),
    /** Hex accent, e.g. "#2f7d57". */
    color: text("color"),
    isBuiltIn: integer("is_built_in", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // What makes ensureBuiltIns() idempotent via onConflictDoNothing.
    uniqueIndex("debt_preset_slug_idx").on(t.slug),
  ],
);

export type DebtPresetRow = typeof debtPresets.$inferSelect;
export type DebtPresetInsertRow = typeof debtPresets.$inferInsert;
