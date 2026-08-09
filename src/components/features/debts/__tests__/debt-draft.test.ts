import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateInstallments } from "../../../../services/schedule-generator.ts";
import {
  applyPreset,
  emptyDraft,
  formatBpsAsPercent,
  parsePercentToBps,
  previewInstallments,
  toCreateDebtInput,
  validateDraft,
  type DebtDraft,
  type DebtDraftField,
} from "../debt-draft.ts";

const valid = (over: Partial<DebtDraft> = {}): DebtDraft => ({
  ...emptyDraft("payable"),
  counterpartyName: "Bank ABC",
  title: "Laptop",
  principal: 10_000_000,
  ...over,
});

const preset = {
  id: 1,
  slug: "shopee-paylater",
  name: "SPayLater",
  kind: "institution" as const,
  direction: "payable" as const,
  scheduleType: "recurring" as const,
  intervalUnit: "month" as const,
  intervalCount: 1,
  periodCount: 3,
  interestRateBps: 295,
  interestMethod: "flat" as const,
  dueDay: 5,
  graceDays: 0,
  reminderDays: 3,
  roundingUnit: 1000,
  icon: null,
  color: null,
  isBuiltIn: true,
  sortOrder: 2,
  createdAt: new Date(),
};

const touched = (...fields: DebtDraftField[]) => new Set<DebtDraftField>(fields);

describe("draft validation", () => {
  it("wants an amount, a party and a title", () => {
    const errors = validateDraft(emptyDraft("payable"));

    assert.equal(errors.principal, "principalRequired");
    assert.equal(errors.counterpartyName, "counterpartyRequired");
    assert.equal(errors.title, "titleRequired");
  });

  it("accepts a party picked from the list without a typed name", () => {
    const errors = validateDraft(
      valid({ counterpartyName: "", counterpartyId: 7 }),
    );
    assert.equal(errors.counterpartyName, undefined);
  });

  it("rejects an amount over the ceiling", () => {
    assert.equal(
      validateDraft(valid({ principal: 1_000_000_000_000 })).principal,
      "principalTooLarge",
    );
  });

  it("asks nothing extra of an open schedule", () => {
    assert.deepEqual(validateDraft(valid({ scheduleType: "open" })), {});
  });

  it("needs a date for a single payment", () => {
    assert.equal(
      validateDraft(valid({ scheduleType: "single" })).anchorDate,
      "anchorDateRequired",
    );
  });

  it("checks the shape of a recurring schedule", () => {
    const errors = validateDraft(
      valid({
        scheduleType: "recurring",
        anchorDate: null,
        periodCount: 0,
        dueDay: 32,
      }),
    );

    assert.equal(errors.anchorDate, "anchorDateRequired");
    assert.equal(errors.periodCount, "periodCountInvalid");
    assert.equal(errors.dueDay, "dueDayInvalid");
  });

  it("passes a complete recurring schedule", () => {
    assert.deepEqual(
      validateDraft(
        valid({
          scheduleType: "recurring",
          anchorDate: new Date(2025, 0, 31),
          periodCount: 12,
          dueDay: 31,
        }),
      ),
      {},
    );
  });

  it("needs at least one complete custom row", () => {
    assert.equal(
      validateDraft(valid({ scheduleType: "custom" })).customRows,
      "customRowsRequired",
    );

    assert.equal(
      validateDraft(
        valid({
          scheduleType: "custom",
          customRows: [{ key: 1, dueDate: new Date(2025, 0, 5), amountValue: null }],
        }),
      ).customRows,
      "customRowAmountRequired",
    );
  });

  it("reports every section at once, not one screen at a time", () => {
    const errors = validateDraft(
      emptyDraft("payable"),
    );

    // A missing title and a missing schedule date have to surface together —
    // that is the whole reason the wizard collapsed into one screen.
    assert.equal(errors.title, "titleRequired");
    assert.equal(errors.principal, "principalRequired");
  });
});

describe("fixed instalment validation", () => {
  const fixed = (over: Partial<DebtDraft> = {}) =>
    valid({
      scheduleType: "recurring",
      anchorDate: new Date(2025, 0, 5),
      principal: 3_000_000,
      periodCount: 3,
      installmentAmount: 1_045_000,
      ...over,
    });

  it("passes a quote that covers the principal", () => {
    assert.deepEqual(validateDraft(fixed()), {});
  });

  it("rejects instalments that never reach the principal", () => {
    assert.equal(
      validateDraft(fixed({ installmentAmount: 900_000 })).installmentAmount,
      "installmentAmountTooSmall",
    );
  });

  it("rejects a zero instalment", () => {
    assert.equal(
      validateDraft(fixed({ installmentAmount: 0 })).installmentAmount,
      "installmentAmountRequired",
    );
  });

  it("says nothing when no instalment was given", () => {
    assert.equal(
      validateDraft(fixed({ installmentAmount: null })).installmentAmount,
      undefined,
    );
  });

  it("checks a single payment against the principal too", () => {
    assert.equal(
      validateDraft(
        fixed({ scheduleType: "single", installmentAmount: 2_000_000 }),
      ).installmentAmount,
      "installmentAmountTooSmall",
    );
  });
});

describe("preset seeding", () => {
  it("fills every untouched field", () => {
    const next = applyPreset(emptyDraft("payable"), preset, touched(), "SPayLater");

    assert.equal(next.scheduleType, "recurring");
    assert.equal(next.periodCount, 3);
    assert.equal(next.interestRateBps, 295);
    assert.equal(next.interestMethod, "flat");
    assert.equal(next.counterpartyKind, "institution");
    assert.equal(next.title, "SPayLater");
    assert.equal(next.presetSlug, "shopee-paylater");
  });

  it("leaves a field the user already edited alone", () => {
    const draft = { ...emptyDraft("payable"), periodCount: 6, title: "Laptop" };
    const next = applyPreset(
      draft,
      preset,
      touched("periodCount", "title"),
      "SPayLater",
    );

    assert.equal(next.periodCount, 6);
    assert.equal(next.title, "Laptop");
    // Everything untouched still re-seeds.
    assert.equal(next.interestRateBps, 295);
  });

  it("re-seeds when a different preset is chosen", () => {
    const first = applyPreset(emptyDraft("payable"), preset, touched(), "SPayLater");
    const second = applyPreset(
      first,
      { ...preset, slug: "bank-kta", periodCount: 12, interestRateBps: 100 },
      touched(),
      "KTA",
    );

    assert.equal(second.periodCount, 12);
    assert.equal(second.presetSlug, "bank-kta");
  });
});

describe("preview", () => {
  it("matches what the generator would produce", () => {
    const draft = valid({
      scheduleType: "recurring",
      anchorDate: new Date(2025, 0, 31),
      dueDay: 31,
      periodCount: 12,
      interestRateBps: 100,
      interestMethod: "flat",
    });

    assert.deepEqual(
      previewInstallments(draft),
      generateInstallments(
        {
          principal: 10_000_000,
          interestRateBps: 100,
          interestMethod: "flat",
        },
        {
          scheduleType: "recurring",
          anchorDate: new Date(2025, 0, 31),
          dueDay: 31,
          intervalUnit: "month",
          intervalCount: 1,
          periodCount: 12,
          roundingUnit: 1000,
        },
      ),
    );
  });

  it("sorts and numbers custom rows", () => {
    const rows = previewInstallments(
      valid({
        scheduleType: "custom",
        customRows: [
          { key: 1, dueDate: new Date(2025, 2, 5), amountValue: 300_000 },
          { key: 2, dueDate: new Date(2025, 0, 5), amountValue: 200_000 },
        ],
      }),
    );

    assert.deepEqual(
      rows.map((r) => [r.sequence, r.totalAmount]),
      [
        [1, 200_000],
        [2, 300_000],
      ],
    );
  });

  it("shows nothing until there is an amount", () => {
    assert.deepEqual(previewInstallments(emptyDraft("payable")), []);
  });
});

describe("create input", () => {
  it("clears schedule fields the chosen type does not use", () => {
    const input = toCreateDebtInput(
      valid({
        scheduleType: "open",
        anchorDate: new Date(2025, 0, 5),
        periodCount: 12,
        dueDay: 31,
      }),
    );

    assert.equal(input.schedule.anchorDate, null);
    assert.equal(input.schedule.periodCount, null);
    assert.equal(input.schedule.dueDay, null);
    assert.equal(input.schedule.intervalUnit, null);
  });

  it("passes the preset slug through as the counterparty key", () => {
    const input = toCreateDebtInput(valid({ presetSlug: "kredivo" }));
    assert.deepEqual(input.counterparty, {
      name: "Bank ABC",
      kind: "person",
      presetKey: "kredivo",
    });
  });

  it("prefers an existing counterparty id over the typed name", () => {
    const input = toCreateDebtInput(valid({ counterpartyId: 9 }));
    assert.deepEqual(input.counterparty, { id: 9 });
  });

  it("carries custom rows across, sorted", () => {
    const input = toCreateDebtInput(
      valid({
        scheduleType: "custom",
        customRows: [
          { key: 1, dueDate: new Date(2025, 2, 5), amountValue: 300_000 },
          { key: 2, dueDate: new Date(2025, 0, 5), amountValue: 200_000 },
        ],
      }),
    );

    assert.deepEqual(
      input.customInstallments?.map((row) => row.totalAmount),
      [200_000, 300_000],
    );
  });

  it("does not record cash flow without a wallet", () => {
    assert.equal(
      toCreateDebtInput(valid({ recordCashFlow: true, walletId: null }))
        .recordCashFlow,
      false,
    );
  });

  it("derives the rate from a fixed instalment and marks it manual", () => {
    const input = toCreateDebtInput(
      valid({
        scheduleType: "recurring",
        anchorDate: new Date(2025, 0, 5),
        principal: 3_000_000,
        periodCount: 3,
        installmentAmount: 1_045_000,
        // Deliberately contradictory: the quote wins over whatever the
        // advanced section was left holding.
        interestRateBps: 5_000,
        interestMethod: "flat",
      }),
    );

    assert.equal(input.interestMethod, "manual");
    assert.equal(input.interestRateBps, 150);
    assert.equal(input.schedule.installmentAmount, 1_045_000);
  });

  it("keeps the typed rate when there is no fixed instalment", () => {
    const input = toCreateDebtInput(
      valid({
        scheduleType: "recurring",
        anchorDate: new Date(2025, 0, 5),
        periodCount: 3,
        interestRateBps: 295,
        interestMethod: "flat",
      }),
    );

    assert.equal(input.interestMethod, "flat");
    assert.equal(input.interestRateBps, 295);
    assert.equal(input.schedule.installmentAmount, null);
  });

  it("drops the instalment on a schedule type that cannot use it", () => {
    const input = toCreateDebtInput(
      valid({ scheduleType: "open", installmentAmount: 1_045_000 }),
    );

    assert.equal(input.schedule.installmentAmount, null);
  });
});

describe("percent parsing", () => {
  it("reads both separators", () => {
    assert.equal(parsePercentToBps("2.95"), 295);
    assert.equal(parsePercentToBps("2,95"), 295);
    assert.equal(parsePercentToBps("1"), 100);
  });

  it("treats an empty field as no interest", () => {
    assert.equal(parsePercentToBps(""), 0);
  });

  it("rejects anything that is not a number", () => {
    assert.equal(parsePercentToBps("2.9.5"), null);
    assert.equal(parsePercentToBps("abc"), null);
  });

  it("round-trips", () => {
    assert.equal(formatBpsAsPercent(295), "2.95");
    assert.equal(formatBpsAsPercent(100), "1");
    assert.equal(formatBpsAsPercent(0), "");
  });
});
