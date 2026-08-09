import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect } from "react";

import type { DebtDirection, DebtWithSummary } from "@/db";
import { debtQueries } from "@/db";
import { useRefresh } from "@/hooks/use-refresh";

/**
 * Live list of debts in one direction — open and closed both, so a debt does
 * not vanish the moment it is paid off. Each row carries what is billed, what
 * has been paid, when the next installment falls due and how many are overdue,
 * all summed from the installments rather than stored on the debt.
 */
export function useDebts(direction: DebtDirection) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();

  const { data, error, updatedAt } = useLiveQuery(
    debtQueries.listWithSummary({ direction }),
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
