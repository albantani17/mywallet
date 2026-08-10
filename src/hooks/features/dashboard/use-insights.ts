import { useMemo } from "react";

import { insightQueries, schema } from "@/db";
import type {
  CategorySpendRow,
  LargestTransactionRow,
  MonthlyTotalsRow,
  PeriodTotalsRow,
} from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";
import {
  compareSpending,
  dailyAverage,
  flowSplit,
  monthlySeries,
  projectMonthEnd,
  topCategories,
  EMPTY_TOTALS,
} from "@/services/insight";
import {
  addMonths,
  daysInMonth,
  endOfDay,
  endOfMonth,
  startOfMonth,
} from "@/utils/format-date";

/** How many months the cash-flow chart shows, including the current one. */
export const TREND_MONTHS = 6;

const INSIGHT_TABLES = [schema.transactions, schema.categories];

/**
 * The three insight cards on the home screen.
 *
 * One `now` for the whole section, so the month boundaries, the day count and
 * the chart cannot be measured a render apart.
 *
 * The month-on-month figure compares like with like: the first ten days of this
 * month against the first ten of the last one. Comparing a running month with a
 * finished one reads as a 90% saving on the 3rd of every month, which is the
 * fastest way to make an insight untrustworthy.
 */
export function useInsights() {
  const { refreshKey, refresh } = useRefresh();
  const now = useMemo(() => new Date(), []);

  const windows = useMemo(() => {
    const monthStart = startOfMonth(now);
    const previous = addMonths(now, -1);

    return {
      thisMonth: { from: monthStart, to: endOfDay(now) },
      // The same slice of last month — same day number, clamped by addMonths
      // when last month is shorter.
      samePeriodLastMonth: {
        from: startOfMonth(previous),
        to: endOfDay(previous),
      },
      previousMonth: {
        from: startOfMonth(previous),
        to: endOfMonth(previous),
      },
      trend: {
        from: startOfMonth(addMonths(now, -(TREND_MONTHS - 1))),
        to: endOfDay(now),
      },
    };
  }, [now]);

  const current = useLiveData(
    insightQueries.periodTotals(windows.thisMonth),
    INSIGHT_TABLES,
    [windows, refreshKey],
  );

  const baseline = useLiveData(
    insightQueries.periodTotals(windows.samePeriodLastMonth),
    INSIGHT_TABLES,
    [windows, refreshKey],
  );

  const spending = useLiveData(
    insightQueries.spendingByCategory(windows.thisMonth),
    INSIGHT_TABLES,
    [windows, refreshKey],
  );

  const largest = useLiveData(
    insightQueries.largestTransaction(windows.thisMonth),
    INSIGHT_TABLES,
    [windows, refreshKey],
  );

  const trend = useLiveData(
    insightQueries.monthlyTotals(windows.trend),
    INSIGHT_TABLES,
    [windows, refreshKey],
  );

  const thisMonth = (current.data?.[0] as PeriodTotalsRow) ?? EMPTY_TOTALS;
  const lastMonth = (baseline.data?.[0] as PeriodTotalsRow) ?? EMPTY_TOTALS;

  const daysElapsed = now.getDate();
  const average = dailyAverage(thisMonth.expense, daysElapsed);

  return {
    thisMonth,
    samePeriodLastMonth: lastMonth,
    comparison: compareSpending(thisMonth.expense, lastMonth.expense),
    split: flowSplit(thisMonth.income, thisMonth.expense),
    /** True once there is a previous period to compare against at all. */
    hasBaseline: lastMonth.expense > 0,
    daysElapsed,
    dailyAverage: average,
    projected: projectMonthEnd(average, daysInMonth(now)),
    breakdown: topCategories((spending.data ?? []) as CategorySpendRow[]),
    largest: (largest.data?.[0] as LargestTransactionRow | undefined) ?? null,
    series: monthlySeries((trend.data ?? []) as MonthlyTotalsRow[], {
      now,
      months: TREND_MONTHS,
    }),
    month: windows.thisMonth,
    previousMonthDate: addMonths(now, -1),
    now,
    isReady: current.updatedAt !== undefined,
    error: current.error ?? spending.error ?? trend.error,
    refresh,
  };
}

export type Insights = ReturnType<typeof useInsights>;
