import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { counterparties } from "./counterparties";
import { wallets } from "./wallets";

export const DEBT_DIRECTIONS = ["payable", "receivable"] as const;
export const DEBT_STATUSES = [
  "active",
  "settled",
  "written_off",
  "cancelled",
] as const;
export const INTEREST_METHODS = [
  "none",
  "flat",
  "effective",
  "manual",
] as const;

/**
 * The header of a debt in either direction. Everything about *when* it is due
 * lives in `debt_schedules` (the rule) and `installments` (the concrete rows);
 * this table only holds what the debt is and what it started as.
 *
 * `principal` is the original amount in minor units. Nothing here is ever
 * decremented — how much is left is summed from the installments and their
 * payment allocations, so a restructure or a penalty cannot be lost to a
 * stale running total.
 */
export const debts = sqliteTable(
  "debts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    counterpartyId: integer("counterparty_id")
      .notNull()
      .references(() => counterparties.id),
    /** Where the money landed (payable) or came from (receivable). */
    walletId: integer("wallet_id").references(() => wallets.id),
    direction: text("direction", { enum: DEBT_DIRECTIONS }).notNull(),
    title: text("title").notNull(),
    principal: integer("principal").notNull(),
    /**
     * Interest per period in basis points — 1%/month is 100. An integer
     * because no float ever gets near the money maths here; the UI divides by
     * 100 to show a percentage.
     */
    interestRateBps: integer("interest_rate_bps").notNull().default(0),
    interestMethod: text("interest_method", { enum: INTEREST_METHODS })
      .notNull()
      .default("none"),
    /** The date of the transaction, or the day the loan was disbursed. */
    originDate: integer("origin_date", { mode: "timestamp" }).notNull(),
    currency: text("currency").notNull().default("IDR"),
    status: text("status", { enum: DEBT_STATUSES }).notNull().default("active"),
    closedAt: integer("closed_at", { mode: "timestamp" }),
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
    index("debt_status_idx").on(t.status),
    index("debt_direction_status_idx").on(t.direction, t.status),
    index("debt_counterparty_idx").on(t.counterpartyId),

    // The enum columns carry no CHECK on purpose — they are TypeScript-only
    // constraints, so adding a status needs no migration. These two are
    // different: they encode invariants the money maths relies on.
    check("positive_principal", sql`${t.principal} > 0`),
    check("non_negative_interest_rate", sql`${t.interestRateBps} >= 0`),
  ],
);

export type DebtRow = typeof debts.$inferSelect;
export type DebtInsertRow = typeof debts.$inferInsert;
export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];
export type DebtStatus = (typeof DEBT_STATUSES)[number];
export type InterestMethod = (typeof INTEREST_METHODS)[number];
