import { useEffect, useMemo } from "react";

import { debtQueries, debtScheduleQueries, schema } from "@/db";
import type { DebtSchedule, DebtWithSummary } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";

import { DEBT_SUMMARY_TABLES } from "./use-debts";

/**
 * One debt, live, with the refresh plumbing the whole detail screen shares.
 *
 * Every figure on it is derived — `useLiveData` is what keeps it moving when a
 * payment lands, since the query itself only selects FROM `debts`. `refreshKey`
 * is handed back so the sibling hooks (installments, payments, schedule) share
 * one pull-to-refresh.
 */
export function useDebt(debtId: number | null) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();
  // One clock for the screen, so the header and every row agree on what is late.
  const now = useMemo(() => new Date(), []);

  const { data, error, updatedAt } = useLiveData(
    // A missing id still has to run a query — hooks cannot be skipped — so it
    // runs one that matches nothing.
    debtQueries.getWithSummary(debtId ?? -1, now),
    DEBT_SUMMARY_TABLES,
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
  const { data, updatedAt } = useLiveData(
    debtScheduleQueries.getByDebt(debtId ?? -1),
    [schema.debtSchedules],
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
