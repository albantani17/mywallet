import { debtInsertSchema, debtRepository } from "@/db";
import type { Debt } from "@/db";

import { transactionService } from "./transaction-service";

export type RecordPaymentInput = {
  debtId: number;
  amount: number;
  walletId: number;
  occurredAt: Date;
  note?: string | null;
};

export type RecordPaymentResult = {
  /** What is still owed after this payment; never negative. */
  outstanding: number;
  /** True when this payment closed the debt. */
  isSettled: boolean;
};

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

  /**
   * Records a repayment against a debt.
   *
   * The money moves the opposite way from the debt itself: a receivable being
   * repaid is income into whichever wallet the user names, which is why the
   * wallet is asked for again rather than reusing the one the loan came from —
   * people are repaid in cash for a transfer they made, and vice versa.
   *
   * Unlike the disbursement, this transaction IS tagged with `debtId`: that tag
   * is the definition of a repayment, and summing the tagged rows is how the
   * outstanding balance is derived.
   *
   * The amount is deliberately not capped at what is owed. A partial payment is
   * normal, and someone rounding up — paying 100.000 on a 95.000 debt — should
   * not be blocked. Either way, once nothing is left the debt settles itself:
   * the remainder is re-read from the database after the insert rather than
   * computed here, so it counts every payment ever made, not just this one.
   */
  async recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult> {
    const debt = await debtRepository.getById(input.debtId);
    if (!debt) throw new Error(`Debt ${input.debtId} not found`);

    await transactionService.createTransaction({
      // Being repaid a receivable brings money in; repaying a debt of your own
      // sends it out.
      type: debt.direction === "receivable" ? "income" : "expense",
      amount: input.amount,
      walletId: input.walletId,
      categoryId: null,
      occurredAt: input.occurredAt,
      note: input.note,
      debtId: debt.id,
    });

    const remaining = await debtRepository.getOutstanding(debt.id);
    const isSettled = remaining <= 0;

    if (isSettled && debt.status !== "settled") {
      await debtRepository.settle(debt.id);
    }

    return { outstanding: Math.max(remaining, 0), isSettled };
  },
};
