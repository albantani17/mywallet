import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCustomInstallments,
  validateCustomRows,
} from "../custom-installments.ts";

const row = (day: number, totalAmount: number | null = 500_000) => ({
  dueDate: new Date(2025, 0, day),
  totalAmount,
});

describe("custom installments", () => {
  it("sorts by date and numbers the sequence from one", () => {
    const rows = buildCustomInstallments([row(20), row(5), row(12)]);

    assert.deepEqual(
      rows.map((r) => [r.sequence, r.dueDate?.getDate()]),
      [
        [1, 5],
        [2, 12],
        [3, 20],
      ],
    );
  });

  it("leaves no gap in the sequence after an incomplete row is dropped", () => {
    const rows = buildCustomInstallments([
      row(5),
      { dueDate: null, totalAmount: 100_000 },
      row(12),
    ]);

    assert.deepEqual(
      rows.map((r) => r.sequence),
      [1, 2],
    );
  });

  it("marks every row modified, so a regenerate cannot wipe the schedule", () => {
    const rows = buildCustomInstallments([row(5), row(12)]);
    assert.ok(rows.every((r) => r.isModified === true));
  });

  it("books the whole amount as principal and keeps the original date", () => {
    const [only] = buildCustomInstallments([row(5, 750_000)]);

    assert.equal(only.principalAmount, 750_000);
    assert.equal(only.interestAmount, 0);
    assert.equal(only.totalAmount, 750_000);
    assert.deepEqual(only.originalDueDate, only.dueDate);
  });

  it("sums to exactly what was typed", () => {
    const rows = buildCustomInstallments([
      row(5, 333_333),
      row(12, 333_333),
      row(20, 333_334),
    ]);

    assert.equal(
      rows.reduce((sum, r) => sum + r.totalAmount, 0),
      1_000_000,
    );
  });

  describe("validation", () => {
    it("rejects an empty list", () => {
      assert.deepEqual(validateCustomRows([]), { code: "empty" });
    });

    it("reports which row is missing a date", () => {
      assert.deepEqual(
        validateCustomRows([row(5), { dueDate: null, totalAmount: 100 }]),
        { code: "missingDate", index: 1 },
      );
    });

    it("reports a missing or zero amount", () => {
      assert.deepEqual(validateCustomRows([row(5, null)]), {
        code: "invalidAmount",
        index: 0,
      });
      assert.deepEqual(validateCustomRows([row(5, 0)]), {
        code: "invalidAmount",
        index: 0,
      });
    });

    it("accepts complete rows in any order", () => {
      assert.equal(validateCustomRows([row(20), row(5)]), null);
    });
  });
});
