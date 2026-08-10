/**
 * The arithmetic behind the home screen's insights.
 *
 * Kept pure and database-free so it can be unit-tested: the queries hand over
 * rows, everything that turns them into a sentence happens here.
 */

export type PeriodTotals = {
  /** Income and expense with debt cash flow already excluded. */
  income: number;
  expense: number;
  /** Loan principal moving in and out — real money, but not earnings or spending. */
  debtIn: number;
  debtOut: number;
};

export const EMPTY_TOTALS: PeriodTotals = {
  income: 0,
  expense: 0,
  debtIn: 0,
  debtOut: 0,
};

export type SpendingComparison = {
  /** current − previous, signed. */
  delta: number;
  /** Share of the previous figure, e.g. 0.12 for 12% more. Null with no base. */
  ratio: number | null;
  direction: "up" | "down" | "flat";
};

/**
 * How this period compares with the one before it.
 *
 * `ratio` is null rather than Infinity when there is nothing to compare with —
 * the first month of use has no baseline, and "spending up ∞%" is worse than
 * saying nothing.
 */
export function compareSpending(
  current: number,
  previous: number,
): SpendingComparison {
  const delta = current - previous;

  return {
    delta,
    ratio: previous > 0 ? delta / previous : null,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

/**
 * Spending per day so far.
 *
 * The divisor is the days *elapsed*, not the length of the month: dividing the
 * first three days of spending by 31 would report a rate nobody is spending at.
 */
export function dailyAverage(expense: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return Math.round(expense / daysElapsed);
}

/** Where the month lands if the current rate holds. */
export function projectMonthEnd(average: number, daysInMonth: number): number {
  return Math.round(average * daysInMonth);
}

export type FlowSplit = {
  /** Whole percentages of the month's total movement. They always sum to 100. */
  incomePercent: number;
  expensePercent: number;
  /** Which way the month is leaning, for the emphasis in the UI. */
  dominant: "income" | "expense" | "balanced";
  /** No money moved at all — there is nothing to draw. */
  isEmpty: boolean;
};

/**
 * The month split between what came in and what went out.
 *
 * Both sides are shares of the *total movement*, not of each other, so one bar
 * holds them both and the bigger half is visibly the bigger half. Income and
 * expense as percentages of one another would need two bars and still not show
 * at a glance which way the month is going.
 *
 * The two figures are made to sum to 100 by deriving the second from the first:
 * rounding each on its own produces "51% / 50%" often enough to look broken.
 */
export function flowSplit(income: number, expense: number): FlowSplit {
  const total = income + expense;
  if (total <= 0) {
    return {
      incomePercent: 0,
      expensePercent: 0,
      dominant: "balanced",
      isEmpty: true,
    };
  }

  const incomePercent = Math.round((income / total) * 100);

  return {
    incomePercent,
    expensePercent: 100 - incomePercent,
    dominant:
      income > expense ? "income" : expense > income ? "expense" : "balanced",
    isEmpty: false,
  };
}

export type CategorySpendRow = {
  categoryId: number | null;
  name: string | null;
  slug: string | null;
  icon: string | null;
  color: string | null;
  total: number;
};

export type CategorySlice = CategorySpendRow & {
  /** Share of the period's spending, 0..1. */
  share: number;
  /** True for the rolled-up remainder rather than a real category. */
  isOther: boolean;
};

export type CategoryBreakdown = {
  slices: CategorySlice[];
  total: number;
};

/**
 * The biggest few categories, with everything else rolled into one slice.
 *
 * The remainder is kept rather than dropped: a top five that silently omits
 * 40% of the spending invites the user to conclude the total is wrong.
 */
export function topCategories(
  rows: CategorySpendRow[],
  limit = 5,
): CategoryBreakdown {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  if (total <= 0) return { slices: [], total: 0 };

  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit);

  const slices: CategorySlice[] = head.map((row) => ({
    ...row,
    share: row.total / total,
    isOther: false,
  }));

  const restTotal = rest.reduce((sum, row) => sum + row.total, 0);
  if (restTotal > 0) {
    slices.push({
      categoryId: null,
      name: null,
      slug: null,
      icon: null,
      color: null,
      total: restTotal,
      share: restTotal / total,
      isOther: true,
    });
  }

  return { slices, total };
}

export type MonthlyTotalsRow = PeriodTotals & {
  /** "YYYY-MM", as grouped in SQL. */
  month: string;
};

export type MonthBucket = PeriodTotals & {
  month: string;
  /** First day of the month, for formatting the label in the caller's locale. */
  date: Date;
  net: number;
};

export type MonthlySeries = {
  buckets: MonthBucket[];
  /** Largest single bar in the series — what every bar is scaled against. */
  max: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A fixed-length run of months ending with the current one.
 *
 * Months with no transactions are filled with zeroes instead of being skipped:
 * a chart that silently drops empty months puts March next to June and reads
 * as a steady decline.
 */
export function monthlySeries(
  rows: MonthlyTotalsRow[],
  { now = new Date(), months = 6 }: { now?: Date; months?: number } = {},
): MonthlySeries {
  const byMonth = new Map(rows.map((row) => [row.month, row]));

  const buckets: MonthBucket[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    const row = byMonth.get(key);

    const totals: PeriodTotals = {
      income: row?.income ?? 0,
      expense: row?.expense ?? 0,
      debtIn: row?.debtIn ?? 0,
      debtOut: row?.debtOut ?? 0,
    };

    buckets.push({
      ...totals,
      month: key,
      date,
      net: totals.income - totals.expense,
    });
  }

  const max = buckets.reduce(
    (highest, bucket) => Math.max(highest, bucket.income, bucket.expense),
    0,
  );

  return { buckets, max };
}
