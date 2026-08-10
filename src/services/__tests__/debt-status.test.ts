import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  debtTone,
  dueBreakdown,
  installmentStatus,
  isOverdue,
  summarise,
} from "../debt-status.ts";

const now = new Date(2025, 7, 20);
const past = new Date(2025, 7, 10);
const older = new Date(2025, 6, 10);
const future = new Date(2025, 8, 10);

describe("installment status", () => {
  it("is upcoming while the date is ahead and nothing is paid", () => {
    assert.equal(
      installmentStatus(
        { dueDate: future, totalAmount: 500_000, paidAmount: 0 },
        { now },
      ),
      "upcoming",
    );
  });

  it("is overdue once the date and its grace have passed", () => {
    assert.equal(
      installmentStatus(
        { dueDate: past, totalAmount: 500_000, paidAmount: 0 },
        { now },
      ),
      "overdue",
    );
  });

  it("is still upcoming inside the grace period", () => {
    assert.equal(
      installmentStatus(
        { dueDate: past, totalAmount: 500_000, paidAmount: 0 },
        { now, graceDays: 30 },
      ),
      "upcoming",
    );
  });

  // Scenario 4
  it("goes partial then paid as the money arrives", () => {
    assert.equal(
      installmentStatus(
        { dueDate: future, totalAmount: 500_000, paidAmount: 200_000 },
        { now },
      ),
      "partial",
    );
    assert.equal(
      installmentStatus(
        { dueDate: future, totalAmount: 500_000, paidAmount: 500_000 },
        { now },
      ),
      "paid",
    );
  });

  // Scenario 7
  it("never marks a dateless row overdue", () => {
    const row = { dueDate: null, totalAmount: 500_000, paidAmount: 0 };

    assert.equal(installmentStatus(row, { now }), "open");
    assert.equal(isOverdue(row, { now }), false);
  });

  it("does not call a fully paid row overdue, however late it was", () => {
    assert.equal(
      isOverdue({ dueDate: past, totalAmount: 500_000, paidAmount: 500_000 }, { now }),
      false,
    );
  });
});

describe("debt tone", () => {
  const active = {
    counterpartyKind: "institution" as const,
    status: "active",
    outstanding: 500_000,
    nextDueDate: past,
    overdueCount: 0,
  };

  it("shouts only about an institution that is actually late", () => {
    assert.equal(debtTone({ ...active, overdueCount: 2 }), "overdue");
  });

  it("never turns red on a debt to a person, however late", () => {
    assert.equal(
      debtTone({ ...active, counterpartyKind: "person", overdueCount: 3 }),
      "due",
    );
  });

  it("stays neutral when there is no due date at all", () => {
    assert.equal(
      debtTone({ ...active, nextDueDate: null, overdueCount: 0 }),
      "neutral",
    );
  });

  it("is settled once nothing is outstanding or the debt is closed", () => {
    assert.equal(debtTone({ ...active, outstanding: 0 }), "settled");
    assert.equal(debtTone({ ...active, status: "settled" }), "settled");
    assert.equal(
      debtTone({ ...active, status: "cancelled", overdueCount: 5 }),
      "settled",
    );
  });

  it("is a plain due date when nothing is late", () => {
    assert.equal(debtTone({ ...active, nextDueDate: future }), "due");
  });
});

describe("debt progress", () => {
  // Scenario 10
  it("reports settled only when every installment is covered", () => {
    const rows = [
      { dueDate: past, totalAmount: 500_000, paidAmount: 500_000 },
      { dueDate: future, totalAmount: 500_000, paidAmount: 500_000 },
    ];

    const progress = summarise(rows, { now });
    assert.equal(progress.isSettled, true);
    assert.equal(progress.outstanding, 0);
    assert.equal(progress.ratio, 1);
    assert.equal(progress.paidCount, 2);
  });

  it("is not settled while one row is short", () => {
    const progress = summarise(
      [
        { dueDate: past, totalAmount: 500_000, paidAmount: 500_000 },
        { dueDate: past, totalAmount: 500_000, paidAmount: 400_000 },
      ],
      { now },
    );

    assert.equal(progress.isSettled, false);
    assert.equal(progress.outstanding, 100_000);
    assert.equal(progress.overdueCount, 1);
  });

  it("does not let an overpaid row hide a shortfall on another", () => {
    const progress = summarise(
      [
        { dueDate: past, totalAmount: 500_000, paidAmount: 700_000 },
        { dueDate: past, totalAmount: 500_000, paidAmount: 0 },
      ],
      { now },
    );

    assert.equal(progress.paid, 500_000);
    assert.equal(progress.outstanding, 500_000);
    assert.equal(progress.isSettled, false);
  });

  it("treats a debt with no installments as unsettled", () => {
    assert.equal(summarise([], { now }).isSettled, false);
  });
});

describe("due breakdown", () => {
  const row = (
    id: number,
    dueDate: Date | null,
    paidAmount = 0,
    totalAmount = 500_000,
  ) => ({ id, sequence: id, dueDate, totalAmount, paidAmount, remaining: 0 });

  it("bills the arrears together with the instalment already due", () => {
    const due = dueBreakdown(
      [row(1, older), row(2, past), row(3, future)],
      { now },
    );

    assert.equal(due.dueNowAmount, 1_000_000);
    assert.equal(due.arrearsAmount, 1_000_000);
    assert.equal(due.arrearsCount, 2);
    assert.equal(due.next?.sequence, 1);
    assert.equal(due.nextRemaining, 500_000);
    assert.equal(due.suggestedAmount, 1_000_000);
  });

  it("counts what is left on a partly paid row, not its full amount", () => {
    const due = dueBreakdown([row(1, past, 200_000), row(2, future)], { now });

    assert.equal(due.dueNowAmount, 300_000);
    assert.equal(due.nextRemaining, 300_000);
    assert.equal(due.next?.remaining, 300_000);
  });

  it("bills an instalment inside its grace period even though it is not late", () => {
    const due = dueBreakdown([row(1, past)], { now, graceDays: 30 });

    assert.equal(due.dueNowAmount, 500_000);
    assert.equal(due.arrearsCount, 0);
    assert.equal(due.suggestedAmount, 500_000);
  });

  it("falls back to the next instalment when nothing is due yet", () => {
    const due = dueBreakdown([row(1, future), row(2, future)], { now });

    assert.equal(due.dueNowAmount, 0);
    assert.equal(due.suggestedAmount, 500_000);
    assert.equal(due.next?.sequence, 1);
  });

  it("suggests the dateless row of an open schedule", () => {
    const due = dueBreakdown([row(1, null, 100_000)], { now });

    assert.equal(due.dueNowAmount, 0);
    assert.equal(due.arrearsCount, 0);
    assert.equal(due.suggestedAmount, 400_000);
  });

  it("has nothing to suggest once every instalment is covered", () => {
    const due = dueBreakdown([row(1, past, 500_000)], { now });

    assert.equal(due.next, null);
    assert.equal(due.dueNowAmount, 0);
    assert.equal(due.suggestedAmount, 0);
  });
});
