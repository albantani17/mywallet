/**
 * Spreads a payment across the installments it settles.
 *
 * A payment is an event; which obligations it closes is a separate decision,
 * and one the user may override. Keeping that decision here — pure, no
 * database — is what makes "Rp 1.000.000 → covers #3 and #4" previewable
 * before anything is written.
 */

/** The shape the allocator needs; `InstallmentWithPaid` satisfies it. */
export type AllocatableInstallment = {
  id: number;
  sequence: number;
  dueDate: Date | null;
  totalAmount: number;
  paidAmount: number;
};

export type PlannedAllocation = {
  installmentId: number;
  sequence: number;
  dueDate: Date | null;
  amount: number;
};

export type AllocationPlan = {
  allocations: PlannedAllocation[];
  /** How much of the payment found a home. */
  allocated: number;
  /**
   * What is left over once every installment is full. Never silently dropped:
   * the caller either refuses the payment or records it and shows the surplus.
   */
  unallocated: number;
};

/**
 * Oldest debt first: by due date ascending, then by sequence.
 *
 * Dateless rows (an `open` debt) sort last rather than first. A plain date sort
 * would float them to the top, since null compares low — and money would land
 * on the row with no deadline while a genuinely overdue one stayed unpaid.
 */
export function byOldestFirst(
  a: AllocatableInstallment,
  b: AllocatableInstallment,
): number {
  const aTime = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
  const bTime = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;
  return a.sequence - b.sequence;
}

/**
 * The default automatic split: fill the oldest outstanding installment, then
 * carry the rest forward.
 */
export function planAllocation(
  amount: number,
  installments: AllocatableInstallment[],
): AllocationPlan {
  const allocations: PlannedAllocation[] = [];
  let remaining = Math.max(Math.floor(amount), 0);

  for (const installment of [...installments].sort(byOldestFirst)) {
    if (remaining <= 0) break;

    const owed = installment.totalAmount - installment.paidAmount;
    if (owed <= 0) continue;

    const applied = Math.min(owed, remaining);
    allocations.push({
      installmentId: installment.id,
      sequence: installment.sequence,
      dueDate: installment.dueDate,
      amount: applied,
    });
    remaining -= applied;
  }

  return {
    allocations,
    allocated: allocations.reduce((sum, a) => sum + a.amount, 0),
    unallocated: remaining,
  };
}

export type AllocationInput = { installmentId: number; amount: number };

export const ALLOCATION_ERROR_CODES = [
  "nonPositive",
  "exceedsPayment",
  "unknownInstallment",
  "overpaidInstallment",
  "duplicateInstallment",
] as const;

export type AllocationErrorCode = (typeof ALLOCATION_ERROR_CODES)[number];

export type AllocationError = {
  code: AllocationErrorCode;
  /** The installment's own sequence, for a message that names the right row. */
  sequence?: number;
};

/**
 * Guards the two invariants the whole module rests on. Either one leaking
 * makes the outstanding total drift a little at a time, with nothing on screen
 * ever looking wrong — so both are checked before a row is written, and the
 * caller runs the write inside a transaction so a failure leaves nothing.
 *
 * Returns a code rather than a sentence: the manual allocation editor shows
 * this to the user, and the user does not read English.
 */
export function allocationError(
  paymentAmount: number,
  allocations: AllocationInput[],
  installments: AllocatableInstallment[],
): AllocationError | null {
  const total = allocations.reduce((sum, a) => sum + a.amount, 0);

  if (allocations.some((a) => a.amount <= 0)) {
    return { code: "nonPositive" };
  }

  // SUM(allocations) <= payment.amount
  if (total > paymentAmount) {
    return { code: "exceedsPayment" };
  }

  const byId = new Map(installments.map((i) => [i.id, i]));

  for (const allocation of allocations) {
    const installment = byId.get(allocation.installmentId);
    if (!installment) return { code: "unknownInstallment" };

    // SUM(allocations for this installment) <= installment.totalAmount
    const owed = installment.totalAmount - installment.paidAmount;
    if (allocation.amount > owed) {
      return { code: "overpaidInstallment", sequence: installment.sequence };
    }
  }

  const seen = new Set<number>();
  for (const allocation of allocations) {
    // The unique index on (payment_id, installment_id) would reject this as a
    // raw SQLite error; catching it here keeps the message readable.
    if (seen.has(allocation.installmentId)) {
      return { code: "duplicateInstallment" };
    }
    seen.add(allocation.installmentId);
  }

  return null;
}

/**
 * The same check as an English sentence, for the service layer — which throws
 * to roll its transaction back and logs rather than being read by anyone.
 */
export function validateAllocations(
  paymentAmount: number,
  allocations: AllocationInput[],
  installments: AllocatableInstallment[],
): string | null {
  const error = allocationError(paymentAmount, allocations, installments);
  if (!error) return null;

  switch (error.code) {
    case "nonPositive":
      return "An allocation must be greater than zero";
    case "exceedsPayment":
      return "Allocations exceed the payment amount";
    case "unknownInstallment":
      return "Allocation points at an unknown installment";
    case "overpaidInstallment":
      return `Installment #${error.sequence} would be overpaid`;
    case "duplicateInstallment":
      return "The same installment is allocated twice";
  }
}
