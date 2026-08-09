import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useMemo } from "react";

import { debtQueries, debtScheduleQueries } from "@/db";
import type { DebtSchedule, DebtWithSummary } from "@/db";
import { useRefresh } from "@/hooks/use-refresh";

/**
 * One debt, live, with the refresh plumbing the whole detail screen shares.
 *
 * `refreshKey` is handed back so the sibling hooks (installments, payments,
 * schedule) can take the same one: a live query only watches the table it
 * selects FROM, so recording a payment leaves the debt row stale until
 * something touches `debts`. One pull re-runs all four.
 */
export function useDebt(debtId: number | null) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();
  // One clock for the screen, so the header and every row agree on what is late.
  const now = useMemo(() => new Date(), []);

  const { data, error, updatedAt } = useLiveQuery(
    // A missing id still has to run a query — hooks cannot be skipped — so it
    // runs one that matches nothing.
    debtQueries.getWithSummary(debtId ?? -1, now),
    [debtId, now, refreshKey],
  );

  useEffect(settle, [settle, updatedAt, error]);

  const rows = (data ?? []) as DebtWithSummary[];

  return {
    debt: rows[0] ?? null,
    now,
    isReady: updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
    refreshKey,
  };
}

/**
 * The schedule rule behind a debt. Only `graceDays` matters to the detail
 * screen — it is what decides how late an installment may be before it counts
 * as overdue, and the header and the rows must use the same value.
 */
export function useDebtSchedule(debtId: number | null, refreshKey = 0) {
  const { data, updatedAt } = useLiveQuery(
    debtScheduleQueries.getByDebt(debtId ?? -1),
    [debtId, refreshKey],
  );

  const schedule = ((data ?? []) as DebtSchedule[])[0] ?? null;

  return {
    schedule,
    // Zero while loading: counting something overdue that is merely unloaded
    // would flash a red chip that then disappears.
    graceDays: schedule?.graceDays ?? 0,
    isReady: updatedAt !== undefined,
  };
}
