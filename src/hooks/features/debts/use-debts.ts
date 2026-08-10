import { useEffect } from "react";

import type { DebtDirection, DebtWithSummary } from "@/db";
import { debtQueries, schema } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";

/**
 * Everything a debt summary reads. Only `debts` is the FROM table; the money
 * comes from the installments and the allocations against them, the name from
 * the counterparty, and the grace period from the schedule.
 */
export const DEBT_SUMMARY_TABLES = [
  schema.debts,
  schema.counterparties,
  schema.installments,
  schema.paymentAllocations,
  schema.debtSchedules,
];

/**
 * Live list of debts in one direction — open and closed both, so a debt does
 * not vanish the moment it is paid off. Each row carries what is billed, what
 * has been paid, when the next installment falls due and how many are overdue,
 * all summed from the installments rather than stored on the debt.
 */
export function useDebts(direction: DebtDirection) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();

  const { data, error, updatedAt } = useLiveData(
    debtQueries.listWithSummary({ direction }),
    DEBT_SUMMARY_TABLES,
    [direction, refreshKey],
  );

  useEffect(settle, [settle, updatedAt, error]);

  return {
    debts: (data ?? []) as DebtWithSummary[],
    // Undefined until the first query resolves — callers use it to avoid
    // showing the empty state before anything has loaded.
    isReady: updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
  };
}
