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

/** Where a period lands if the current rate holds to its last day. */
export function projectPeriodEnd(average: number, periodDays: number): number {
  return Math.round(average * periodDays);
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

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export const INSIGHT_PERIODS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "last6Months",
  "last12Months",
  "custom",
] as const;

export type InsightPeriod = (typeof INSIGHT_PERIODS)[number];

/** How finely the trend chart slices a period. */
export type Granularity = "day" | "week" | "month";

export type DateRange = { from: Date; to: Date };

export type ResolvedPeriod = DateRange & {
  /** The window this one is compared against. */
  previous: DateRange;
  granularity: Granularity;
  /** Today falls inside the period, so it is still filling up. */
  isOngoing: boolean;
  /**
   * Where a running period naturally ends — the end of this month for the
   * presets that run to today. Null once there is nothing left to project.
   */
  projectTo: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Local copies of the date helpers in utils/format-date.ts. This module stays
// free of `@/` imports so `node --test` can load it on its own.
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  // setDate rolls months and years over, and survives a DST change.
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Clamps the day: one month before 31 March is 28 February. */
function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();

  const copy = new Date(date);
  copy.setFullYear(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
  return copy;
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Calendar days from `from` to `to`, both included. */
export function countDays(from: Date, to: Date): number {
  // Rounded, not floored: a DST shift makes one day 23 or 25 hours long.
  return (
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS) +
    1
  );
}

/**
 * Daily bars up to a month, weekly up to a quarter, monthly beyond. Past those
 * points the bars get too thin to tap, or too few to show a trend.
 */
export function granularityFor(days: number): Granularity {
  if (days <= 31) return "day";
  if (days <= 92) return "week";
  return "month";
}

/**
 * Turns the chosen preset into a window and the window it is compared with.
 *
 * Running periods compare like with like: the 1st–10th of this month against
 * the 1st–10th of the last one, the last three months so far against the same
 * slice of the three before. Comparing a running period with a finished one
 * reads as a 90% saving on the 3rd of every month.
 *
 * A custom range is compared with the stretch of the same length right before
 * it. Its ends are swapped if picked backwards, and a missing end means today.
 */
export function resolvePeriod(
  period: InsightPeriod,
  now: Date,
  custom: { from: Date | null; to: Date | null } = { from: null, to: null },
): ResolvedPeriod {
  const { from, to, previous } = windowsFor(period, now, custom);
  const isOngoing =
    from.getTime() <= now.getTime() && now.getTime() <= to.getTime();

  // The presets stop at today, but the month they are in carries on; a custom
  // range ending today has nothing ahead of it.
  const naturalEnd =
    period === "custom" || period === "lastMonth" ? to : endOfMonth(now);

  return {
    from,
    to,
    previous,
    granularity: granularityFor(countDays(from, to)),
    isOngoing,
    projectTo:
      isOngoing && naturalEnd.getTime() > endOfDay(now).getTime()
        ? naturalEnd
        : null,
  };
}

function windowsFor(
  period: InsightPeriod,
  now: Date,
  custom: { from: Date | null; to: Date | null },
): DateRange & { previous: DateRange } {
  switch (period) {
    case "lastMonth": {
      const last = addMonths(now, -1);
      const beforeLast = addMonths(now, -2);
      return {
        from: startOfMonth(last),
        to: endOfMonth(last),
        previous: { from: startOfMonth(beforeLast), to: endOfMonth(beforeLast) },
      };
    }
    case "last3Months":
      return runningMonths(now, 3);
    case "last6Months":
      return runningMonths(now, 6);
    case "last12Months":
      return runningMonths(now, 12);
    case "custom": {
      let from = startOfDay(custom.from ?? now);
      let to = endOfDay(custom.to ?? now);
      if (from.getTime() > to.getTime()) {
        [from, to] = [startOfDay(to), endOfDay(from)];
      }
      const previousEnd = endOfDay(addDays(from, -1));
      return {
        from,
        to,
        previous: {
          from: startOfDay(addDays(previousEnd, -(countDays(from, to) - 1))),
          to: previousEnd,
        },
      };
    }
    case "thisMonth":
    default:
      return runningMonths(now, 1);
  }
}

/** The last `count` calendar months up to today, and the same slice before. */
function runningMonths(
  now: Date,
  count: number,
): DateRange & { previous: DateRange } {
  return {
    from: startOfMonth(addMonths(now, -(count - 1))),
    to: endOfDay(now),
    previous: {
      from: startOfMonth(addMonths(now, -(2 * count - 1))),
      // Same day number, clamped by addMonths when that month is shorter.
      to: endOfDay(addMonths(now, -count)),
    },
  };
}

/**
 * Days that have actually happened inside a period, today included — the
 * divisor for a daily average. A finished period counts all of its days; one
 * still running stops at today.
 */
export function daysElapsedIn(period: ResolvedPeriod, now: Date): number {
  const end = period.isOngoing ? now : period.to;
  return Math.max(countDays(period.from, end), 0);
}

// ---------------------------------------------------------------------------
// Trend series
// ---------------------------------------------------------------------------

export type SeriesTotalsRow = PeriodTotals & {
  /**
   * The bucket as grouped in SQL: "YYYY-MM-DD" for a day, the Monday that
   * starts the week for a week, "YYYY-MM" for a month.
   */
  bucket: string;
};

export type SeriesBucket = PeriodTotals & {
  key: string;
  /** First day of the bucket, for formatting the label in the caller's locale. */
  date: Date;
  /** Last day of the bucket, clamped to the period. */
  end: Date;
  net: number;
};

export type Series = {
  buckets: SeriesBucket[];
  granularity: Granularity;
  /** Largest single bar in the series — what every bar is scaled against. */
  max: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** The Monday on or before `date` — the same rule as the SQL bucket. */
function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  // getDay(): Sunday is 0, so Sunday steps back six days rather than forward.
  return addDays(day, -((day.getDay() + 6) % 7));
}

/**
 * Every bucket of a period, in order.
 *
 * Buckets with no transactions are filled with zeroes instead of being skipped:
 * a chart that silently drops empty months puts March next to June and reads
 * as a steady decline.
 */
export function bucketSeries(
  rows: SeriesTotalsRow[],
  { from, to, granularity }: DateRange & { granularity: Granularity },
): Series {
  const byKey = new Map(rows.map((row) => [row.bucket, row]));
  const buckets: SeriesBucket[] = [];

  let cursor =
    granularity === "day"
      ? startOfDay(from)
      : granularity === "week"
        ? startOfWeek(from)
        : startOfMonth(from);

  while (cursor.getTime() <= to.getTime()) {
    const next =
      granularity === "day"
        ? addDays(cursor, 1)
        : granularity === "week"
          ? addDays(cursor, 7)
          : startOfMonth(addMonths(cursor, 1));
    const key = granularity === "month" ? monthKey(cursor) : dayKey(cursor);
    const row = byKey.get(key);

    const totals: PeriodTotals = {
      income: row?.income ?? 0,
      expense: row?.expense ?? 0,
      debtIn: row?.debtIn ?? 0,
      debtOut: row?.debtOut ?? 0,
    };

    const lastDay = endOfDay(addDays(next, -1));
    buckets.push({
      ...totals,
      key,
      date: cursor,
      end: lastDay.getTime() > to.getTime() ? to : lastDay,
      net: totals.income - totals.expense,
    });

    cursor = next;
  }

  const max = buckets.reduce(
    (highest, bucket) => Math.max(highest, bucket.income, bucket.expense),
    0,
  );

  return { buckets, granularity, max };
}

// ---------------------------------------------------------------------------
// Daily allowance
// ---------------------------------------------------------------------------

export type DailyAllowance = {
  /** Days left in the month, today included. */
  daysLeft: number;
  /** What can be spent per day from now on without running out. */
  allowance: number;
  /** What has actually been spent per day this month. */
  average: number;
  /** Main-fund balance at month end if the current pace holds. */
  projectedBalance: number;
  status: "onTrack" | "over" | "empty";
};

/**
 * How much can be spent per day for the rest of the month.
 *
 * The balance is divided over the days left *including today*: today's
 * spending so far has already left the balance, and what remains of today
 * still needs a share of it.
 *
 * The projection subtracts the current pace for the days after today only —
 * today is already partly in the balance, and counting it again would make
 * every projection a day too pessimistic.
 */
export function dailyAllowance({
  balance,
  spentThisMonth,
  now,
}: {
  balance: number;
  spentThisMonth: number;
  now: Date;
}): DailyAllowance {
  const daysLeft = daysInMonth(now) - now.getDate() + 1;
  const average = dailyAverage(spentThisMonth, now.getDate());
  const allowance = balance > 0 ? Math.floor(balance / daysLeft) : 0;

  return {
    daysLeft,
    allowance,
    average,
    projectedBalance: balance - average * (daysLeft - 1),
    status: balance <= 0 ? "empty" : average > allowance ? "over" : "onTrack",
  };
}
