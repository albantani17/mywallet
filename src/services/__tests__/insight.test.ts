import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareSpending,
  dailyAverage,
  flowSplit,
  bucketSeries,
  countDays,
  dailyAllowance,
  daysElapsedIn,
  projectPeriodEnd,
  resolvePeriod,
  topCategories,
  type CategorySpendRow,
  type SeriesTotalsRow,
} from "../insight.ts";

const now = new Date(2026, 7, 10); // 10 August 2026

describe("spending comparison", () => {
  it("reports the share spent above last period", () => {
    const comparison = compareSpending(1_120_000, 1_000_000);

    assert.equal(comparison.delta, 120_000);
    assert.equal(comparison.ratio, 0.12);
    assert.equal(comparison.direction, "up");
  });

  it("reports a fall as a negative delta", () => {
    const comparison = compareSpending(800_000, 1_000_000);

    assert.equal(comparison.delta, -200_000);
    assert.equal(comparison.direction, "down");
  });

  // The first month of use: there is no baseline, and a percentage would be
  // Infinity dressed up as insight.
  it("has no ratio when nothing was spent before", () => {
    const comparison = compareSpending(500_000, 0);

    assert.equal(comparison.ratio, null);
    assert.equal(comparison.direction, "up");
  });

  it("calls an unchanged figure flat", () => {
    assert.equal(compareSpending(0, 0).direction, "flat");
  });
});

describe("daily rate", () => {
  it("divides by the days elapsed, not the length of the month", () => {
    assert.equal(dailyAverage(3_000_000, 10), 300_000);
  });

  it("does not divide by zero on the first tick of a month", () => {
    assert.equal(dailyAverage(50_000, 0), 0);
  });

  it("projects the period end from the current rate", () => {
    assert.equal(projectPeriodEnd(300_000, 31), 9_300_000);
  });
});

describe("flow split", () => {
  it("splits the month between what came in and what went out", () => {
    const split = flowSplit(6_000_000, 4_000_000);

    assert.equal(split.incomePercent, 60);
    assert.equal(split.expensePercent, 40);
    assert.equal(split.dominant, "income");
  });

  it("leans to expense when more went out than came in", () => {
    const split = flowSplit(4_000_000, 6_000_000);

    assert.equal(split.expensePercent, 60);
    assert.equal(split.dominant, "expense");
  });

  // Rounding each side on its own gives 51/50 here, which reads as a bug.
  it("always sums to 100", () => {
    const split = flowSplit(1_005, 995);

    assert.equal(split.incomePercent + split.expensePercent, 100);
  });

  it("gives the whole bar to the only side with movement", () => {
    assert.equal(flowSplit(0, 400_000).expensePercent, 100);
    assert.equal(flowSplit(400_000, 0).incomePercent, 100);
  });

  it("calls an equal month balanced", () => {
    assert.equal(flowSplit(500, 500).dominant, "balanced");
  });

  it("is empty when no money moved at all", () => {
    assert.equal(flowSplit(0, 0).isEmpty, true);
  });
});

describe("category breakdown", () => {
  const row = (id: number, total: number): CategorySpendRow => ({
    categoryId: id,
    name: `Category ${id}`,
    slug: `category-${id}`,
    icon: null,
    color: null,
    total,
  });

  it("keeps the top five and rolls the rest into one slice", () => {
    const breakdown = topCategories([
      row(1, 600),
      row(2, 500),
      row(3, 400),
      row(4, 300),
      row(5, 200),
      row(6, 60),
      row(7, 40),
    ]);

    assert.equal(breakdown.total, 2_100);
    assert.equal(breakdown.slices.length, 6);

    const other = breakdown.slices.at(-1);
    assert.equal(other?.isOther, true);
    assert.equal(other?.total, 100);

    // Every rupiah is accounted for, which is the whole point of the remainder.
    const summed = breakdown.slices.reduce((sum, slice) => sum + slice.total, 0);
    assert.equal(summed, breakdown.total);
  });

  it("adds no remainder when everything fits", () => {
    const breakdown = topCategories([row(1, 100), row(2, 50)]);

    assert.equal(breakdown.slices.length, 2);
    assert.equal(breakdown.slices.some((slice) => slice.isOther), false);
    assert.equal(breakdown.slices[0].share, 100 / 150);
  });

  it("returns nothing at all for a month with no spending", () => {
    assert.deepEqual(topCategories([]), { slices: [], total: 0 });
  });
});

const totalsRow = (
  bucket: string,
  income: number,
  expense: number,
): SeriesTotalsRow => ({ bucket, income, expense, debtIn: 0, debtOut: 0 });

const ymd = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

describe("periods", () => {
  it("compares this month so far with the same slice of last month", () => {
    const period = resolvePeriod("thisMonth", now);

    assert.equal(ymd(period.from), "2026-8-1");
    assert.equal(ymd(period.to), "2026-8-10");
    assert.equal(ymd(period.previous.from), "2026-7-1");
    assert.equal(ymd(period.previous.to), "2026-7-10");
    assert.equal(period.granularity, "day");
    assert.equal(period.isOngoing, true);
  });

  it("takes last month whole and compares it with the month before", () => {
    const period = resolvePeriod("lastMonth", now);

    assert.equal(ymd(period.from), "2026-7-1");
    assert.equal(ymd(period.to), "2026-7-31");
    assert.equal(ymd(period.previous.from), "2026-6-1");
    assert.equal(ymd(period.previous.to), "2026-6-30");
    assert.equal(period.isOngoing, false);
  });

  it("slices three months by week and six by month", () => {
    const quarter = resolvePeriod("last3Months", now);

    assert.equal(ymd(quarter.from), "2026-6-1");
    assert.equal(ymd(quarter.previous.from), "2026-3-1");
    assert.equal(ymd(quarter.previous.to), "2026-5-10");
    assert.equal(quarter.granularity, "week");

    assert.equal(resolvePeriod("last6Months", now).granularity, "month");
  });

  it("compares a custom range with the same length right before it", () => {
    const period = resolvePeriod("custom", now, {
      from: new Date(2026, 6, 11),
      to: new Date(2026, 6, 20),
    });

    assert.equal(countDays(period.from, period.to), 10);
    assert.equal(ymd(period.previous.from), "2026-7-1");
    assert.equal(ymd(period.previous.to), "2026-7-10");
  });

  it("swaps a custom range picked backwards", () => {
    const period = resolvePeriod("custom", now, {
      from: new Date(2026, 6, 20),
      to: new Date(2026, 6, 11),
    });

    assert.equal(ymd(period.from), "2026-7-11");
    assert.equal(ymd(period.to), "2026-7-20");
  });

  it("projects a running preset to the end of the month", () => {
    assert.equal(ymd(resolvePeriod("thisMonth", now).projectTo!), "2026-8-31");
    assert.equal(ymd(resolvePeriod("last3Months", now).projectTo!), "2026-8-31");
    assert.equal(resolvePeriod("lastMonth", now).projectTo, null);
    assert.equal(
      resolvePeriod("custom", now, { from: new Date(2026, 7, 1), to: now })
        .projectTo,
      null,
    );
  });

  it("counts elapsed days only up to today in a running period", () => {
    assert.equal(daysElapsedIn(resolvePeriod("thisMonth", now), now), 10);
    assert.equal(daysElapsedIn(resolvePeriod("lastMonth", now), now), 31);
  });
});

describe("trend series", () => {
  it("returns a bar per day, filling quiet days with zeroes", () => {
    const series = bucketSeries([totalsRow("2026-08-03", 500, 200)], {
      ...resolvePeriod("thisMonth", now),
    });

    assert.equal(series.buckets.length, 10);
    assert.equal(series.buckets[0].key, "2026-08-01");
    assert.equal(series.buckets[2].income, 500);
    assert.equal(series.buckets[1].expense, 0);
    assert.equal(series.max, 500);
  });

  it("starts weeks on the Monday on or before the first day", () => {
    const series = bucketSeries([], resolvePeriod("last3Months", now));

    // 1 June 2026 is a Monday; 10 August sits in the week of the 10th.
    assert.equal(series.buckets[0].key, "2026-06-01");
    assert.equal(series.buckets.at(-1)?.key, "2026-08-10");
  });

  it("returns one bucket per month, across a year boundary", () => {
    const series = bucketSeries([totalsRow("2025-12", 900, 400)], {
      ...resolvePeriod("last6Months", new Date(2026, 0, 15)),
    });

    assert.equal(series.buckets.length, 6);
    assert.equal(series.buckets[0].key, "2025-08");
    assert.equal(series.buckets.at(-1)?.key, "2026-01");
    assert.equal(series.buckets.at(-2)?.net, 500);
  });

  it("clamps the last bucket to the end of the period", () => {
    const series = bucketSeries([], resolvePeriod("last6Months", now));

    assert.equal(ymd(series.buckets.at(-1)!.end), "2026-8-10");
  });
});

describe("daily allowance", () => {
  it("spreads the balance over the days left, today included", () => {
    const allowance = dailyAllowance({
      balance: 2_200_000,
      spentThisMonth: 1_000_000,
      now,
    });

    // August has 31 days: the 10th to the 31st is 22 days.
    assert.equal(allowance.daysLeft, 22);
    assert.equal(allowance.allowance, 100_000);
    assert.equal(allowance.average, 100_000);
    assert.equal(allowance.status, "onTrack");
  });

  it("flags a pace the balance cannot sustain", () => {
    const allowance = dailyAllowance({
      balance: 1_100_000,
      spentThisMonth: 1_000_000,
      now,
    });

    assert.equal(allowance.allowance, 50_000);
    assert.equal(allowance.status, "over");
    // 21 more days at 100k from 1.1m.
    assert.equal(allowance.projectedBalance, -1_000_000);
  });

  it("allows nothing once the main funds are empty", () => {
    const allowance = dailyAllowance({ balance: -5_000, spentThisMonth: 0, now });

    assert.equal(allowance.allowance, 0);
    assert.equal(allowance.status, "empty");
  });
});
