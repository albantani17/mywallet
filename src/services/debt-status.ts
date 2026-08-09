/**
 * Derived status. Nothing here is stored.
 *
 * A `paid` flag on an installment is a lie waiting to happen: the moment a
 * payment is deleted, re-allocated or entered twice, the flag and the money
 * disagree and the money is right. Status is therefore always recomputed from
 * what has actually landed on the row.
 */

const MS_PER_DAY = 86_400_000;

export const INSTALLMENT_STATUSES = [
  "open",
  "upcoming",
  "overdue",
  "partial",
  "paid",
] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export type StatusInstallment = {
  dueDate: Date | null;
  totalAmount: number;
  paidAmount: number;
};

/**
 * Past the due date plus whatever grace the schedule allows.
 *
 * A dateless row is never overdue — that is the whole point of an `open`
 * schedule, and a loan from a friend must not turn red on its own.
 */
export function isOverdue(
  installment: StatusInstallment,
  { graceDays = 0, now = new Date() }: { graceDays?: number; now?: Date } = {},
): boolean {
  if (!installment.dueDate) return false;
  if (installment.paidAmount >= installment.totalAmount) return false;

  return now.getTime() > installment.dueDate.getTime() + graceDays * MS_PER_DAY;
}

export function installmentStatus(
  installment: StatusInstallment,
  options: { graceDays?: number; now?: Date } = {},
): InstallmentStatus {
  if (installment.paidAmount >= installment.totalAmount) return "paid";
  if (!installment.dueDate) return "open";
  if (installment.paidAmount > 0) return "partial";
  return isOverdue(installment, options) ? "overdue" : "upcoming";
}

export const DEBT_TONES = ["settled", "overdue", "due", "neutral"] as const;

export type DebtTone = (typeof DEBT_TONES)[number];

export type ToneDebt = {
  counterpartyKind: "person" | "institution" | null;
  status: string;
  outstanding: number;
  nextDueDate: Date | null;
  overdueCount: number;
};

/**
 * How loudly a debt row should speak. One function, so the rule cannot be
 * half-applied across a dozen ternaries in JSX.
 *
 * The `person` case is the whole reason this exists: a loan from a friend that
 * slipped past its date must not turn red. Money owed to a bank is a problem
 * with a deadline; money owed to your sister is a conversation. Marking the
 * second one in alarm colours makes the app feel like a debt collector, and
 * users stop recording those debts at all — which costs far more than a late
 * reminder gains.
 */
export function debtTone(debt: ToneDebt): DebtTone {
  if (debt.status !== "active" || debt.outstanding <= 0) return "settled";
  // An `open` schedule has no deadline to miss, by design.
  if (!debt.nextDueDate) return "neutral";

  if (debt.overdueCount > 0 && debt.counterpartyKind === "institution") {
    return "overdue";
  }

  return "due";
}

export type DebtProgress = {
  /** SUM(totalAmount) — the full obligation, penalties included. */
  billed: number;
  paid: number;
  /** `billed - paid`, never negative. */
  outstanding: number;
  /** 0..1, for the progress bar. A zero-billed debt reads as complete. */
  ratio: number;
  installmentCount: number;
  paidCount: number;
  overdueCount: number;
  /** True once every installment is covered — what settles the debt. */
  isSettled: boolean;
};

export function summarise(
  installments: StatusInstallment[],
  options: { graceDays?: number; now?: Date } = {},
): DebtProgress {
  let billed = 0;
  let paid = 0;
  let paidCount = 0;
  let overdueCount = 0;

  for (const installment of installments) {
    billed += installment.totalAmount;
    // Clamped: an overpaid row must not mask a shortfall on another one.
    paid += Math.min(installment.paidAmount, installment.totalAmount);

    if (installment.paidAmount >= installment.totalAmount) paidCount += 1;
    else if (isOverdue(installment, options)) overdueCount += 1;
  }

  return {
    billed,
    paid,
    outstanding: Math.max(billed - paid, 0),
    ratio: billed > 0 ? Math.min(paid / billed, 1) : 1,
    installmentCount: installments.length,
    paidCount,
    overdueCount,
    // An installment-less debt is not settled; it is one whose schedule has
    // not been generated yet.
    isSettled: installments.length > 0 && paidCount === installments.length,
  };
}
