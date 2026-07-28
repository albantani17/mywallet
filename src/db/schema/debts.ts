import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { wallets } from "./wallets";

export const DEBT_DIRECTIONS = ["payable", "receivable"] as const;
export const DEBT_STATUSES = ["ongoing", "settled"] as const;

/**
 * Money owed in either direction. `principal` is the original amount in minor
 * units; repayments live in `transactions.debtId`, so the outstanding balance
 * is derived rather than stored (see debtRepository.getOutstanding).
 */
export const debts = sqliteTable(
  "debts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    direction: text("direction", { enum: DEBT_DIRECTIONS }).notNull(),
    counterparty: text("counterparty").notNull(),
    principal: integer("principal").notNull(),
    walletId: integer("wallet_id").references(() => wallets.id),
    dueDate: integer("due_date", { mode: "timestamp" }),
    status: text("status", { enum: DEBT_STATUSES }).notNull().default("ongoing"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("debt_status_idx").on(t.status),
    check("positive_principal", sql`${t.principal} > 0`),
  ],
);

export type DebtRow = typeof debts.$inferSelect;
export type DebtInsertRow = typeof debts.$inferInsert;
export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];
export type DebtStatus = (typeof DEBT_STATUSES)[number];
