import { transactionInsertSchema, transactionRepository } from "@/db";
import type { Transaction, TransactionType } from "@/db";

export type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  walletId: number;
  toWalletId?: number | null;
  categoryId?: number | null;
  fee?: number | null;
  note?: string | null;
  occurredAt: Date;
  dueDate?: Date | null;
  /**
   * Marks this transaction as a repayment of a debt. Only repayments carry it —
   * the outstanding balance is derived by summing every transaction that does.
   */
  debtId?: number | null;
};

export const transactionService = {
  /**
   * Records a transaction.
   *
   * The shape rules live in three places that must agree: the SQLite CHECK
   * constraints, the zod refinements, and this normaliser. Rather than trust
   * the form to have cleared the fields its type does not use, the payload is
   * rebuilt per type here — a stale `toWalletId` left over from switching away
   * from "transfer" would otherwise trip the transfer_shape constraint as a
   * raw SQLite error.
   *
   * Repositories never parse, so this is the layer that validates.
   */
  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const isTransfer = input.type === "transfer";

    const payload = transactionInsertSchema.parse({
      type: input.type,
      amount: input.amount,
      walletId: input.walletId,
      // A transfer names a destination and carries no category; every other
      // type is the mirror image of that.
      toWalletId: isTransfer ? (input.toWalletId ?? null) : null,
      categoryId: isTransfer ? null : (input.categoryId ?? null),
      // Only a transfer can cost anything to make.
      fee: isTransfer ? (input.fee ?? 0) : 0,
      note: input.note?.trim() ? input.note.trim() : null,
      occurredAt: input.occurredAt,
      dueDate: input.type === "bill" ? (input.dueDate ?? null) : null,
      debtId: input.debtId ?? null,
    });

    return transactionRepository.create(payload);
  },

  /**
   * Removes a transaction.
   *
   * Nothing to unwind: balances are summed from the rows themselves rather
   * than cached on the wallet, so deleting the row is the whole undo. Debt
   * repayments are the exception — `payments.transactionId` points here — but
   * those are created and removed through debtService, never this.
   */
  async deleteTransaction(id: number): Promise<void> {
    await transactionRepository.remove(id);
  },
};
