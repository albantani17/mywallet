import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { installmentQueries } from "@/db";
import type { InstallmentWithPaid } from "@/db";

/**
 * A debt's installments in sequence, each carrying what has landed on it.
 *
 * `paidAmount` and `remaining` are summed in SQL from the allocations rather
 * than stored, so they cannot drift out of step with the payments.
 *
 * Takes the detail screen's `refreshKey` so one pull-to-refresh re-runs this
 * query too — see the note in use-debt.ts.
 */
export function useInstallments(debtId: number | null, refreshKey = 0) {
  const { data, error, updatedAt } = useLiveQuery(
    installmentQueries.listByDebt(debtId ?? -1),
    [debtId, refreshKey],
  );

  return {
    installments: (data ?? []) as InstallmentWithPaid[],
    isReady: updatedAt !== undefined,
    error,
  };
}
