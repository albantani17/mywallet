import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dueDateFor,
  flatEquivalentBps,
  generateInstallments,
  type GeneratorDebt,
  type GeneratorSchedule,
} from "../schedule-generator.ts";

const monthly = (over: Partial<GeneratorSchedule> = {}): GeneratorSchedule => ({
  scheduleType: "recurring",
  anchorDate: new Date(2025, 0, 31),
  dueDay: 31,
  intervalUnit: "month",
  intervalCount: 1,
  periodCount: 12,
  roundingUnit: 1000,
  ...over,
});

const debt = (over: Partial<GeneratorDebt> = {}): GeneratorDebt => ({
  principal: 10_000_000,
  interestRateBps: 0,
  interestMethod: "none",
  ...over,
});

const ymd = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;

describe("schedule generator", () => {
  // Scenario 1
  it("clamps a short month without drifting afterwards", () => {
    const rows = generateInstallments(debt(), monthly());

    assert.equal(ymd(rows[0].dueDate ?? null), "2025-01-31");
    assert.equal(ymd(rows[1].dueDate ?? null), "2025-02-28");
    // The point of the whole rule: March goes back to the 31st.
    assert.equal(ymd(rows[2].dueDate ?? null), "2025-03-31");
    assert.equal(ymd(rows[3].dueDate ?? null), "2025-04-30");
    assert.equal(ymd(rows[4].dueDate ?? null), "2025-05-31");
  });

  it("clamps to 29 February in a leap year", () => {
    const date = dueDateFor(new Date(2024, 0, 31), 1, "month", 1, 31);
    assert.equal(ymd(date), "2024-02-29");
  });

  it("steps by days and weeks without touching the day of month", () => {
    assert.equal(ymd(dueDateFor(new Date(2025, 0, 31), 1, "day", 10, 31)), "2025-02-10");
    assert.equal(ymd(dueDateFor(new Date(2025, 0, 31), 2, "week", 1, 31)), "2025-02-14");
  });

  // Scenario 2
  it("sums to the exact obligation, with the last row absorbing the rounding", () => {
    const rows = generateInstallments(
      debt({ interestRateBps: 100, interestMethod: "flat" }),
      monthly(),
    );

    const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    assert.equal(total, 11_200_000);
    assert.equal(rows.length, 12);

    // Rows 1..11 are the round figure the lender quotes.
    for (const row of rows.slice(0, 11)) {
      assert.equal(row.totalAmount, 933_000);
      assert.equal(row.totalAmount % 1000, 0);
    }
    assert.equal(rows[11].totalAmount, 937_000);

    // Components stay consistent with the billed figure.
    for (const row of rows) {
      assert.equal(
        row.principalAmount! + row.interestAmount! + row.feeAmount!,
        row.totalAmount,
      );
    }
    assert.equal(
      rows.reduce((sum, row) => sum + row.interestAmount!, 0),
      1_200_000,
    );
  });

  it("charges nothing when the method is none", () => {
    const rows = generateInstallments(debt(), monthly());
    assert.equal(
      rows.reduce((sum, row) => sum + row.totalAmount, 0),
      10_000_000,
    );
    assert.ok(rows.every((row) => row.interestAmount === 0));
  });

  it("amortises an effective-rate schedule, front-loading the interest", () => {
    const rows = generateInstallments(
      debt({ interestRateBps: 100, interestMethod: "effective" }),
      monthly(),
    );

    assert.ok(rows[0].interestAmount! > rows[11].interestAmount!);
    // Still exact: the last row carries whatever the rounding left over.
    const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    assert.equal(
      total,
      10_000_000 + rows.reduce((sum, row) => sum + row.interestAmount!, 0),
    );
  });

  it("makes one dateless row for an open debt", () => {
    const rows = generateInstallments(
      debt(),
      monthly({ scheduleType: "open", anchorDate: null, periodCount: null }),
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0].dueDate, null);
    assert.equal(rows[0].totalAmount, 10_000_000);
  });

  it("makes one dated row for a single-payment schedule", () => {
    const rows = generateInstallments(
      debt({ interestRateBps: 295, interestMethod: "flat" }),
      monthly({
        scheduleType: "single",
        anchorDate: new Date(2025, 7, 30),
        periodCount: null,
      }),
    );

    assert.equal(rows.length, 1);
    assert.equal(ymd(rows[0].dueDate ?? null), "2025-08-30");
    assert.equal(rows[0].totalAmount, 10_295_000);
  });

  it("generates nothing for a custom schedule", () => {
    assert.deepEqual(
      generateInstallments(debt(), monthly({ scheduleType: "custom" })),
      [],
    );
  });

  it("keeps the original due date alongside the working one", () => {
    const rows = generateInstallments(debt(), monthly({ periodCount: 2 }));
    assert.deepEqual(rows[0].originalDueDate, rows[0].dueDate);
    assert.equal(rows[0].isModified, false);
  });

  describe("fixed instalments", () => {
    // The paylater case: 3.000.000 quoted as 3× 1.045.000.
    const paylater = () =>
      generateInstallments(
        debt({ principal: 3_000_000 }),
        monthly({ periodCount: 3, installmentAmount: 1_045_000 }),
      );

    it("makes every row exactly the quoted instalment", () => {
      const rows = paylater();

      assert.equal(rows.length, 3);
      assert.deepEqual(
        rows.map((r) => r.totalAmount),
        [1_045_000, 1_045_000, 1_045_000],
      );
    });

    it("sums to the quoted total, to the rupiah", () => {
      const total = paylater().reduce((sum, r) => sum + r.totalAmount, 0);
      assert.equal(total, 3_135_000);
    });

    it("keeps the principal whole and books the rest as interest", () => {
      const rows = paylater();

      assert.equal(
        rows.reduce((sum, r) => sum + (r.principalAmount ?? 0), 0),
        3_000_000,
      );
      assert.equal(
        rows.reduce((sum, r) => sum + (r.interestAmount ?? 0), 0),
        135_000,
      );
    });

    it("charges nothing when the instalments only cover the principal", () => {
      const rows = generateInstallments(
        debt({ principal: 3_000_000 }),
        monthly({ periodCount: 3, installmentAmount: 1_000_000 }),
      );

      assert.deepEqual(
        rows.map((r) => r.interestAmount),
        [0, 0, 0],
      );
    });

    it("never books negative interest when the instalments fall short", () => {
      // The form rejects this before it gets here; the generator still refuses
      // to invent a discount out of a typo.
      const rows = generateInstallments(
        debt({ principal: 3_000_000 }),
        monthly({ periodCount: 3, installmentAmount: 900_000 }),
      );

      assert.ok(rows.every((r) => r.interestAmount === 0));
      assert.ok(rows.every((r) => r.principalAmount === 900_000));
    });

    it("ignores the rate it was given", () => {
      const rows = generateInstallments(
        debt({ principal: 3_000_000, interestRateBps: 5_000, interestMethod: "flat" }),
        monthly({ periodCount: 3, installmentAmount: 1_045_000 }),
      );

      assert.equal(rows[0].totalAmount, 1_045_000);
    });

    it("spreads an odd rupiah onto the last row", () => {
      const rows = generateInstallments(
        debt({ principal: 1_000_000 }),
        monthly({ periodCount: 3, installmentAmount: 400_000 }),
      );

      // 200.000 of interest over 3 rows: 66.667 twice, remainder last.
      assert.equal(
        rows.reduce((sum, r) => sum + (r.interestAmount ?? 0), 0),
        200_000,
      );
      assert.equal(rows[2].interestAmount, 66_666);
    });

    it("works for a single-payment schedule too", () => {
      const rows = generateInstallments(
        debt({ principal: 500_000 }),
        monthly({
          scheduleType: "single",
          anchorDate: new Date(2025, 7, 30),
          periodCount: null,
          installmentAmount: 525_000,
        }),
      );

      assert.equal(rows.length, 1);
      assert.equal(rows[0].totalAmount, 525_000);
      assert.equal(rows[0].interestAmount, 25_000);
    });

    it("reports the flat rate the quote works out to", () => {
      // 135.000 over 3.000.000 across 3 months is the 1,5%/month it is sold as.
      assert.equal(flatEquivalentBps(3_000_000, 1_045_000, 3), 150);
      assert.equal(flatEquivalentBps(3_000_000, 1_000_000, 3), 0);
      assert.equal(flatEquivalentBps(0, 1_000_000, 3), 0);
    });
  });
});
