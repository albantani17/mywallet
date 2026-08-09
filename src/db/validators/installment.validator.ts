import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { installments } from "../schema/installments";

// Mirrors non_negative_installment_total. Components may legitimately be zero
// — an interest-free personal loan has no interest row.
const componentSchema = z.int().min(0, "Amount cannot be negative");

// Mirrors positive_sequence.
const sequenceSchema = z.int().min(1, "Sequence starts at 1");

const noteSchema = z.string().trim().max(500, "Note is too long").nullish();

export const installmentSelectSchema = createSelectSchema(installments);

export const installmentInsertSchema = createInsertSchema(installments)
  .extend({
    sequence: sequenceSchema,
    principalAmount: componentSchema.optional(),
    interestAmount: componentSchema.optional(),
    feeAmount: componentSchema.optional(),
    penaltyAmount: componentSchema.optional(),
    totalAmount: componentSchema,
    note: noteSchema,
  })
  // totalAmount is the billed figure with the penalty already inside it, so a
  // total below the penalty means the two drifted apart.
  .refine((i) => i.totalAmount >= (i.penaltyAmount ?? 0), {
    message: "Total must cover the penalty",
    path: ["totalAmount"],
  });

export const installmentUpdateSchema = createUpdateSchema(installments).extend({
  sequence: sequenceSchema.optional(),
  principalAmount: componentSchema.optional(),
  interestAmount: componentSchema.optional(),
  feeAmount: componentSchema.optional(),
  penaltyAmount: componentSchema.optional(),
  totalAmount: componentSchema.optional(),
  note: noteSchema,
});

export type Installment = z.infer<typeof installmentSelectSchema>;
export type InstallmentInsert = z.infer<typeof installmentInsertSchema>;
export type InstallmentUpdate = z.infer<typeof installmentUpdateSchema>;

/** An installment with what has landed on it, summed from its allocations. */
export type InstallmentWithPaid = Installment & {
  paidAmount: number;
  /** `totalAmount - paidAmount`, clamped at zero. */
  remaining: number;
};
