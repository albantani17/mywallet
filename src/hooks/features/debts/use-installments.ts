import { installmentQueries, schema } from "@/db";
import type { InstallmentWithPaid } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";

/**
 * A debt's installments in sequence, each carrying what has landed on it.
 *
 * `paidAmount` and `remaining` are summed in SQL from the allocations rather
 * than stored, so they cannot drift out of step with the payments — which is
 * also why `payment_allocations` has to be watched alongside the FROM table.
 *
 * Takes the detail screen's `refreshKey` so one pull-to-refresh re-runs this
 * query too — see the note in use-debt.ts.
 */
export function useInstallments(debtId: number | null, refreshKey = 0) {
  const { data, error, updatedAt } = useLiveData(
    installmentQueries.listByDebt(debtId ?? -1),
    [schema.installments, schema.paymentAllocations],
    [debtId, refreshKey],
  );

  return {
    installments: (data ?? []) as InstallmentWithPaid[],
    isReady: updatedAt !== undefined,
    error,
  };
}
