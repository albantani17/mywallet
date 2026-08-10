import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareSpending,
  dailyAverage,
  flowSplit,
  monthlySeries,
  projectMonthEnd,
  topCategories,
  type CategorySpendRow,
  type MonthlyTotalsRow,
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

  it("projects the month end from the current rate", () => {
    assert.equal(projectMonthEnd(300_000, 31), 9_300_000);
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

describe("monthly series", () => {
  const month = (key: string, income: number, expense: number): MonthlyTotalsRow => ({
    month: key,
    income,
    expense,
    debtIn: 0,
    debtOut: 0,
  });

  it("always returns the requested run of months, ending with the current one", () => {
    const series = monthlySeries([month("2026-08", 500, 300)], { now });

    assert.equal(series.buckets.length, 6);
    assert.equal(series.buckets[0].month, "2026-03");
    assert.equal(series.buckets.at(-1)?.month, "2026-08");
  });

  it("fills a month with no transactions with zeroes rather than skipping it", () => {
    const series = monthlySeries(
      [month("2026-06", 1_000, 800), month("2026-08", 900, 400)],
      { now },
    );

    const july = series.buckets.find((bucket) => bucket.month === "2026-07");
    assert.equal(july?.income, 0);
    assert.equal(july?.expense, 0);
    assert.equal(july?.net, 0);
  });

  it("scales against the largest bar in the window", () => {
    const series = monthlySeries(
      [month("2026-07", 1_000, 2_500), month("2026-08", 900, 400)],
      { now },
    );

    assert.equal(series.max, 2_500);
  });

  it("crosses a year boundary", () => {
    const series = monthlySeries([], { now: new Date(2026, 0, 15) });

    assert.equal(series.buckets[0].month, "2025-08");
    assert.equal(series.buckets.at(-1)?.month, "2026-01");
  });

  it("nets income against expense per month", () => {
    const series = monthlySeries([month("2026-08", 900, 400)], { now });

    assert.equal(series.buckets.at(-1)?.net, 500);
  });
});
