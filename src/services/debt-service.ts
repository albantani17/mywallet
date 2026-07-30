import { debtInsertSchema, debtRepository } from "@/db";
import type { Debt } from "@/db";

import { transactionService } from "./transaction-service";

export type CreateReceivableInput = {
  principal: number;
  counterparty: string;
  walletId: number;
  issuedAt: Date;
  dueDate?: Date | null;
  note?: string | null;
};

export const debtService = {
  /**
   * Records money lent out.
   *
   * Lending is real spending, so it also books an expense against the wallet
   * the money left — otherwise the wallet balance would keep counting cash the
   * user no longer holds. The expense carries no category: it is not spending
   * on anything, and the transaction row already falls back to a neutral
   * label and glyph when the category is null.
   *
   * The disbursement is deliberately NOT tagged with `debtId`. That column
   * means "repayment": debtRepository sums every transaction pointing at a
   * debt to derive how much is left, so tagging this one would report the
   * debt as fully repaid the moment it was created.
   *
   * There is no surrounding SQL transaction because services reach the data
   * layer through repositories only; the debt is rolled back by hand if the
   * expense fails, which leaves the same end state for the one failure mode
   * that matters.
   */
  async createReceivable(input: CreateReceivableInput): Promise<Debt> {
    const note = input.note?.trim() ? input.note.trim() : null;

    const payload = debtInsertSchema.parse({
      direction: "receivable",
      status: "ongoing",
      counterparty: input.counterparty.trim(),
      principal: input.principal,
      walletId: input.walletId,
      issuedAt: input.issuedAt,
      dueDate: input.dueDate ?? null,
      note,
    });

    const debt = await debtRepository.create(payload);

    try {
      await transactionService.createTransaction({
        type: "expense",
        amount: debt.principal,
        walletId: input.walletId,
        categoryId: null,
        occurredAt: input.issuedAt,
        note,
      });
    } catch (e) {
      await debtRepository.remove(debt.id);
      throw e;
    }

    return debt;
  },
};
