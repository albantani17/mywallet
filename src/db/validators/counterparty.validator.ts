import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { counterparties } from "../schema/counterparties";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Counterparty name is required")
  .max(150, "Counterparty name is too long");

const contactSchema = z.string().trim().max(150, "Contact is too long").nullish();
const noteSchema = z.string().trim().max(500, "Note is too long").nullish();

export const counterpartySelectSchema = createSelectSchema(counterparties);

export const counterpartyInsertSchema = createInsertSchema(
  counterparties,
).extend({
  name: nameSchema,
  contact: contactSchema,
  note: noteSchema,
});

export const counterpartyUpdateSchema = createUpdateSchema(
  counterparties,
).extend({
  name: nameSchema.optional(),
  contact: contactSchema,
  note: noteSchema,
});

export type Counterparty = z.infer<typeof counterpartySelectSchema>;
export type CounterpartyInsert = z.infer<typeof counterpartyInsertSchema>;
export type CounterpartyUpdate = z.infer<typeof counterpartyUpdateSchema>;

/** A counterparty plus how many debts point at it — the delete guard reads this. */
export type CounterpartyWithUsage = Counterparty & { debtCount: number };
