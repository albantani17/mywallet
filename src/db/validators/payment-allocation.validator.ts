import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { paymentAllocations } from "../schema/payment-allocations";

// Mirrors the positive_allocation_amount check constraint. A zero-value
// allocation would be a row claiming a payment touched an installment without
// paying anything towards it.
const amountSchema = z.int().positive("Allocation must be greater than zero");

export const paymentAllocationSelectSchema =
  createSelectSchema(paymentAllocations);

export const paymentAllocationInsertSchema = createInsertSchema(
  paymentAllocations,
).extend({
  amount: amountSchema,
});

export const paymentAllocationUpdateSchema = createUpdateSchema(
  paymentAllocations,
).extend({
  amount: amountSchema.optional(),
});

export type PaymentAllocation = z.infer<typeof paymentAllocationSelectSchema>;
export type PaymentAllocationInsert = z.infer<
  typeof paymentAllocationInsertSchema
>;
export type PaymentAllocationUpdate = z.infer<
  typeof paymentAllocationUpdateSchema
>;
