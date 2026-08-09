import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { installmentStatus } from "../../../../services/debt-status.ts";
import { installmentTone } from "../installment-tone.ts";

describe("installment tone", () => {
  it("only ever shouts about an institution", () => {
    assert.equal(installmentTone("overdue", "institution"), "overdue");
  });

  it("softens a late installment owed to a person", () => {
    assert.equal(installmentTone("overdue", "person"), "late");
  });

  it("softens it for an unknown kind too, rather than guessing", () => {
    assert.equal(installmentTone("overdue", null), "late");
  });

  it("passes every other status through untouched", () => {
    for (const kind of ["person", "institution", null] as const) {
      assert.equal(installmentTone("paid", kind), "paid");
      assert.equal(installmentTone("partial", kind), "partial");
      assert.equal(installmentTone("upcoming", kind), "upcoming");
      assert.equal(installmentTone("open", kind), "open");
    }
  });

  describe("composed with installmentStatus", () => {
    const now = new Date(2025, 7, 20);

    it("leaves a dateless row open for both kinds", () => {
      const row = { dueDate: null, totalAmount: 500_000, paidAmount: 0 };

      for (const kind of ["person", "institution"] as const) {
        assert.equal(installmentTone(installmentStatus(row, { now }), kind), "open");
      }
    });

    it("keeps a row inside its grace period upcoming for both kinds", () => {
      const row = {
        dueDate: new Date(2025, 7, 10),
        totalAmount: 500_000,
        paidAmount: 0,
      };

      for (const kind of ["person", "institution"] as const) {
        assert.equal(
          installmentTone(installmentStatus(row, { now, graceDays: 30 }), kind),
          "upcoming",
        );
      }
    });

    it("splits the two kinds once the grace has run out", () => {
      const row = {
        dueDate: new Date(2025, 7, 10),
        totalAmount: 500_000,
        paidAmount: 0,
      };
      const status = installmentStatus(row, { now });

      assert.equal(installmentTone(status, "institution"), "overdue");
      assert.equal(installmentTone(status, "person"), "late");
    });
  });
});
