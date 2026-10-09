import { useMemo } from "react";

import { insightQueries, schema, walletQueries } from "@/db";
import type {
  CategorySpendRow,
  LargestTransactionRow,
  PeriodTotalsRow,
  SeriesTotalsRow,
} from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";
import {
  bucketSeries,
  compareSpending,
  countDays,
  dailyAllowance,
  dailyAverage,
  daysElapsedIn,
  flowSplit,
  projectPeriodEnd,
  resolvePeriod,
  topCategories,
  EMPTY_TOTALS,
} from "@/services/insight";
import { endOfDay, startOfMonth } from "@/utils/format-date";

import type { InsightPeriodSelection } from "./use-insight-period";

/**
 * Wallets are watched too: flipping a wallet in or out of the main funds
 * changes every figure here without touching a transaction.
 */
const INSIGHT_TABLES = [schema.transactions, schema.categories, schema.wallets];

/**
 * The insight cards on the home screen, for the period the user picked.
 *
 * One `now` for the whole section, so the period bounds, the day counts and the
 * chart cannot be measured a render apart.
 *
 * The daily allowance is always about this month, whatever period is picked —
 * it answers "how much can I spend today", which no other window can.
 */
export function useInsights({
  period,
  customFrom,
  customTo,
}: InsightPeriodSelection) {
  const { refreshKey, refresh } = useRefresh();
  const now = useMemo(() => new Date(), []);

  // Timestamps, not Dates, as dependencies: a Date is a new object each render.
  const fromTime = customFrom?.getTime() ?? null;
  const toTime = customTo?.getTime() ?? null;

  const resolved = useMemo(
    () =>
      resolvePeriod(period, now, {
        from: fromTime === null ? null : new Date(fromTime),
        to: toTime === null ? null : new Date(toTime),
      }),
    [period, now, fromTime, toTime],
  );

  const thisMonth = useMemo(
    () => ({ from: startOfMonth(now), to: endOfDay(now) }),
    [now],
  );

  const range = useMemo(
    () => ({ from: resolved.from, to: resolved.to }),
    [resolved],
  );

  const current = useLiveData(
    insightQueries.periodTotals(range),
    INSIGHT_TABLES,
    [range, refreshKey],
  );

  const baseline = useLiveData(
    insightQueries.periodTotals(resolved.previous),
    INSIGHT_TABLES,
    [resolved, refreshKey],
  );

  const spending = useLiveData(
    insightQueries.spendingByCategory(range),
    INSIGHT_TABLES,
    [range, refreshKey],
  );

  const largest = useLiveData(
    insightQueries.largestTransaction(range),
    INSIGHT_TABLES,
    [range, refreshKey],
  );

  const trend = useLiveData(
    insightQueries.seriesTotals(range, resolved.granularity),
    INSIGHT_TABLES,
    [resolved, refreshKey],
  );

  const monthTotals = useLiveData(
    insightQueries.periodTotals(thisMonth),
    INSIGHT_TABLES,
    [thisMonth, refreshKey],
  );

  const mainBalance = useLiveData(
    walletQueries.mainFundBalance(),
    INSIGHT_TABLES,
    [refreshKey],
  );

  const totals = (current.data?.[0] as PeriodTotalsRow) ?? EMPTY_TOTALS;
  const previousTotals = (baseline.data?.[0] as PeriodTotalsRow) ?? EMPTY_TOTALS;
  const monthSpent =
    (monthTotals.data?.[0] as PeriodTotalsRow | undefined)?.expense ?? 0;

  const daysElapsed = daysElapsedIn(resolved, now);
  const average = dailyAverage(totals.expense, daysElapsed);

  return {
    period,
    resolved,
    totals,
    previousTotals,
    comparison: compareSpending(totals.expense, previousTotals.expense),
    split: flowSplit(totals.income, totals.expense),
    /** True once there is a previous period to compare against at all. */
    hasBaseline: previousTotals.expense > 0,
    daysElapsed,
    dailyAverage: average,
    /** Only a period still running has an end left to project. */
    projected: resolved.projectTo
      ? projectPeriodEnd(average, countDays(resolved.from, resolved.projectTo))
      : null,
    breakdown: topCategories((spending.data ?? []) as CategorySpendRow[]),
    largest: (largest.data?.[0] as LargestTransactionRow | undefined) ?? null,
    series: bucketSeries((trend.data ?? []) as SeriesTotalsRow[], resolved),
    allowance: dailyAllowance({
      balance: Number(mainBalance.data?.[0]?.balance ?? 0),
      spentThisMonth: monthSpent,
      now,
    }),
    now,
    isReady: current.updatedAt !== undefined,
    error: current.error ?? spending.error ?? trend.error,
    refresh,
  };
}

export type Insights = ReturnType<typeof useInsights>;
