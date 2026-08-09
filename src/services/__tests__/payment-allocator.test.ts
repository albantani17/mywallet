import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allocationError,
  planAllocation,
  validateAllocations,
  type AllocatableInstallment,
} from "../payment-allocator.ts";

const installment = (
  over: Partial<AllocatableInstallment> & { id: number },
): AllocatableInstallment => ({
  sequence: over.id,
  dueDate: new Date(2025, 0, over.id),
  totalAmount: 500_000,
  paidAmount: 0,
  ...over,
});

describe("payment allocator", () => {
  // Scenario 3
  it("spreads one payment across two installments, oldest first", () => {
    const plan = planAllocation(1_000_000, [
      installment({ id: 3 }),
      installment({ id: 4 }),
    ]);

    assert.equal(plan.allocations.length, 2);
    assert.deepEqual(
      plan.allocations.map((a) => [a.sequence, a.amount]),
      [
        [3, 500_000],
        [4, 500_000],
      ],
    );
    assert.equal(plan.allocated, 1_000_000);
    assert.equal(plan.unallocated, 0);
  });

  // Scenario 4, first half: a payment smaller than the installment.
  it("part-fills the oldest installment and stops", () => {
    const plan = planAllocation(200_000, [installment({ id: 1 })]);

    assert.deepEqual(plan.allocations.map((a) => a.amount), [200_000]);
    assert.equal(plan.unallocated, 0);
  });

  it("tops up an installment that is already part paid", () => {
    const plan = planAllocation(300_000, [
      installment({ id: 1, paidAmount: 200_000 }),
    ]);

    assert.deepEqual(plan.allocations.map((a) => a.amount), [300_000]);
  });

  it("skips installments that are already full", () => {
    const plan = planAllocation(500_000, [
      installment({ id: 1, paidAmount: 500_000 }),
      installment({ id: 2 }),
    ]);

    assert.deepEqual(
      plan.allocations.map((a) => a.installmentId),
      [2],
    );
  });

  it("reports the surplus rather than losing it", () => {
    const plan = planAllocation(800_000, [installment({ id: 1 })]);

    assert.equal(plan.allocated, 500_000);
    assert.equal(plan.unallocated, 300_000);
  });

  it("sorts dateless rows last, so an overdue one is paid first", () => {
    const plan = planAllocation(500_000, [
      installment({ id: 1, dueDate: null }),
      installment({ id: 2, dueDate: new Date(2025, 0, 10) }),
    ]);

    assert.deepEqual(
      plan.allocations.map((a) => a.installmentId),
      [2],
    );
  });

  describe("invariants", () => {
    // Scenario 8
    it("rejects allocations totalling more than the payment", () => {
      const error = validateAllocations(
        500_000,
        [
          { installmentId: 1, amount: 300_000 },
          { installmentId: 2, amount: 300_000 },
        ],
        [installment({ id: 1 }), installment({ id: 2 })],
      );

      assert.equal(error, "Allocations exceed the payment amount");
    });

    it("rejects an allocation that would overpay an installment", () => {
      const error = validateAllocations(
        900_000,
        [{ installmentId: 1, amount: 900_000 }],
        [installment({ id: 1 })],
      );

      assert.match(error ?? "", /overpaid/);
    });

    it("rejects a zero or negative allocation", () => {
      assert.match(
        validateAllocations(
          500_000,
          [{ installmentId: 1, amount: 0 }],
          [installment({ id: 1 })],
        ) ?? "",
        /greater than zero/,
      );
    });

    it("rejects the same installment twice", () => {
      const error = validateAllocations(
        400_000,
        [
          { installmentId: 1, amount: 200_000 },
          { installmentId: 1, amount: 200_000 },
        ],
        [installment({ id: 1 })],
      );

      assert.match(error ?? "", /twice/);
    });

    it("rejects an unknown installment", () => {
      const error = validateAllocations(
        100_000,
        [{ installmentId: 99, amount: 100_000 }],
        [installment({ id: 1 })],
      );

      assert.match(error ?? "", /unknown/);
    });

    it("accepts a valid manual split", () => {
      const error = validateAllocations(
        500_000,
        [
          { installmentId: 1, amount: 200_000 },
          { installmentId: 2, amount: 300_000 },
        ],
        [installment({ id: 1 }), installment({ id: 2 })],
      );

      assert.equal(error, null);
    });

    it("accepts an automatic plan it produced itself", () => {
      const installments = [installment({ id: 1 }), installment({ id: 2 })];
      const plan = planAllocation(1_000_000, installments);

      assert.equal(
        validateAllocations(1_000_000, plan.allocations, installments),
        null,
      );
    });
  });

  describe("coded errors", () => {
    it("reports each failure as a code", () => {
      const rows = [installment({ id: 1 }), installment({ id: 2 })];

      assert.deepEqual(
        allocationError(500_000, [{ installmentId: 1, amount: 0 }], rows),
        { code: "nonPositive" },
      );
      assert.deepEqual(
        allocationError(
          400_000,
          [
            { installmentId: 1, amount: 300_000 },
            { installmentId: 2, amount: 300_000 },
          ],
          rows,
        ),
        { code: "exceedsPayment" },
      );
      assert.deepEqual(
        allocationError(100_000, [{ installmentId: 99, amount: 100_000 }], rows),
        { code: "unknownInstallment" },
      );
      assert.deepEqual(
        allocationError(
          800_000,
          [
            { installmentId: 1, amount: 100_000 },
            { installmentId: 1, amount: 100_000 },
          ],
          rows,
        ),
        { code: "duplicateInstallment" },
      );
    });

    it("names the installment's own sequence when it would be overpaid", () => {
      // Sequence 7 sits at index 0, so an index would name the wrong row.
      const rows = [installment({ id: 4, sequence: 7 })];

      assert.deepEqual(
        allocationError(900_000, [{ installmentId: 4, amount: 900_000 }], rows),
        { code: "overpaidInstallment", sequence: 7 },
      );
    });

    it("accepts an allocation that exactly fills the remaining amount", () => {
      const rows = [installment({ id: 1, paidAmount: 200_000 })];

      assert.equal(
        allocationError(300_000, [{ installmentId: 1, amount: 300_000 }], rows),
        null,
      );
    });

    it("still produces the English sentences the service throws", () => {
      const rows = [installment({ id: 4, sequence: 7 })];

      assert.equal(
        validateAllocations(900_000, [{ installmentId: 4, amount: 900_000 }], rows),
        "Installment #7 would be overpaid",
      );
      assert.equal(
        validateAllocations(100, [{ installmentId: 4, amount: 0 }], rows),
        "An allocation must be greater than zero",
      );
    });
  });
});
