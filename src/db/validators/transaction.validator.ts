import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { transactions } from "../schema/transactions";

// Mirrors the positive_amount / non_negative_fee check constraints so bad
// input is rejected in the form rather than as a SQLite error.
const amountSchema = z.int().positive("Amount must be greater than zero");
const feeSchema = z.int().min(0, "Fee cannot be negative");

const noteSchema = z.string().trim().max(200, "Note is too long").nullish();

export const transactionSelectSchema = createSelectSchema(transactions);

export const transactionInsertSchema = createInsertSchema(transactions)
  .extend({
    amount: amountSchema,
    fee: feeSchema.optional(),
    note: noteSchema,
  })
  // The zod-side twin of the transfer_shape / no_self_transfer constraints.
  .refine(
    (t) => t.type !== "transfer" || (t.toWalletId != null && t.categoryId == null),
    {
      message: "A transfer needs a destination wallet and no category",
      path: ["toWalletId"],
    },
  )
  .refine((t) => t.type === "transfer" || t.toWalletId == null, {
    message: "Only transfers may have a destination wallet",
    path: ["toWalletId"],
  })
  .refine((t) => t.toWalletId == null || t.toWalletId !== t.walletId, {
    message: "Source and destination wallet must differ",
    path: ["toWalletId"],
  })
  // dueDate is what distinguishes a bill from a plain expense; no other type
  // has anything to be due.
  .refine((t) => t.type === "bill" || t.dueDate == null, {
    message: "Only a bill may have a due date",
    path: ["dueDate"],
  });

export const transactionUpdateSchema = createUpdateSchema(transactions).extend({
  amount: amountSchema.optional(),
  fee: feeSchema.optional(),
  note: noteSchema,
});

export type Transaction = z.infer<typeof transactionSelectSchema>;
export type TransactionInsert = z.infer<typeof transactionInsertSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;

/** A transaction joined with the names it refers to, for list rendering. */
export type TransactionWithRelations = Transaction & {
  walletName: string | null;
  toWalletName: string | null;
  categoryName: string | null;
};
