import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { payments } from "../schema/payments";

// Mirrors the positive_payment_amount check constraint.
const amountSchema = z.int().positive("Amount must be greater than zero");

const referenceSchema = z
  .string()
  .trim()
  .max(100, "Reference is too long")
  .nullish();
const noteSchema = z.string().trim().max(500, "Note is too long").nullish();

export const paymentSelectSchema = createSelectSchema(payments);

export const paymentInsertSchema = createInsertSchema(payments).extend({
  amount: amountSchema,
  reference: referenceSchema,
  note: noteSchema,
});

export const paymentUpdateSchema = createUpdateSchema(payments).extend({
  amount: amountSchema.optional(),
  reference: referenceSchema,
  note: noteSchema,
});

export type Payment = z.infer<typeof paymentSelectSchema>;
export type PaymentInsert = z.infer<typeof paymentInsertSchema>;
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>;

/**
 * A payment with how much of it reached an installment. `amount - allocated`
 * is money the payment could not place; the history screen shows it rather
 * than letting it disappear.
 */
export type PaymentWithAllocations = Payment & {
  walletName: string | null;
  allocated: number;
  unallocated: number;
};
