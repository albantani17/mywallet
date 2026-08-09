import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import type { CounterpartyKind } from "../schema/counterparties";
import { debts } from "../schema/debts";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(150, "Title is too long");

// Mirrors the positive_principal check constraint.
const principalSchema = z.int().positive("Principal must be greater than zero");

// Mirrors non_negative_interest_rate. The ceiling is 1000% per period, high
// enough for any real product and low enough to catch a percentage typed in
// where basis points were meant.
const interestRateSchema = z
  .int()
  .min(0, "Interest rate cannot be negative")
  .max(100_000, "Interest rate is unrealistically high");

const noteSchema = z.string().trim().max(500, "Note is too long").nullish();

export const debtSelectSchema = createSelectSchema(debts);

export const debtInsertSchema = createInsertSchema(debts)
  .extend({
    title: titleSchema,
    principal: principalSchema,
    interestRateBps: interestRateSchema.optional(),
    currency: z.string().trim().length(3, "Currency must be a 3-letter code").optional(),
    note: noteSchema,
  })
  // A rate with no method to apply it would silently never be charged, which
  // reads to the user as the app losing their interest.
  .refine((d) => d.interestMethod !== "none" || !d.interestRateBps, {
    message: "An interest rate needs an interest method",
    path: ["interestMethod"],
  });

export const debtUpdateSchema = createUpdateSchema(debts).extend({
  title: titleSchema.optional(),
  principal: principalSchema.optional(),
  interestRateBps: interestRateSchema.optional(),
  note: noteSchema,
});

export type Debt = z.infer<typeof debtSelectSchema>;
export type DebtInsert = z.infer<typeof debtInsertSchema>;
export type DebtUpdate = z.infer<typeof debtUpdateSchema>;

/**
 * A debt with everything a list row or the detail header needs, all of it
 * summed from the installments and their allocations rather than stored.
 */
export type DebtWithSummary = Debt & {
  counterpartyName: string | null;
  counterpartyKind: CounterpartyKind | null;
  /** SUM(installments.totalAmount) — the full obligation, penalties included. */
  billed: number;
  /** SUM(payment_allocations.amount) across this debt's installments. */
  paid: number;
  /** `billed - paid`, clamped at zero by the repository. */
  outstanding: number;
  /** Earliest due date not yet covered, or null for an open debt. */
  nextDueDate: Date | null;
  /** Installments past their due date plus the schedule's grace. */
  overdueCount: number;
};
