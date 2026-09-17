/**
 * A repayment's cash-flow row is one half of a larger operation: removing it
 * alone would leave the payment and its installment allocations behind. Keep
 * the policy independent from the database so every caller gets the same
 * explicit failure and it remains easy to verify.
 */
export class DebtPaymentTransactionDeletionError extends Error {
  constructor() {
    super("Debt-payment transactions must be removed from the debt detail.");
    this.name = "DebtPaymentTransactionDeletionError";
  }
}

export function assertTransactionCanBeDeleted(isDebtPayment: boolean): void {
  if (isDebtPayment) throw new DebtPaymentTransactionDeletionError();
}
