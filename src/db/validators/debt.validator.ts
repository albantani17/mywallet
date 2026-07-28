import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { debts } from "../schema/debts";

const counterpartySchema = z
  .string()
  .trim()
  .min(1, "Counterparty is required")
  .max(80, "Counterparty is too long");

// Mirrors the positive_principal check constraint.
const principalSchema = z.int().positive("Principal must be greater than zero");

export const debtSelectSchema = createSelectSchema(debts);

export const debtInsertSchema = createInsertSchema(debts).extend({
  counterparty: counterpartySchema,
  principal: principalSchema,
});

export const debtUpdateSchema = createUpdateSchema(debts).extend({
  counterparty: counterpartySchema.optional(),
  principal: principalSchema.optional(),
});

export type Debt = z.infer<typeof debtSelectSchema>;
export type DebtInsert = z.infer<typeof debtInsertSchema>;
export type DebtUpdate = z.infer<typeof debtUpdateSchema>;
