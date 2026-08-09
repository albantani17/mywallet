import type {
  CounterpartyKind,
  DebtDirection,
  DebtPreset,
  InterestMethod,
  IntervalUnit,
  ScheduleType,
} from "@/db";
import type { CreateDebtInput } from "@/services/debt-service";
// Relative, with the extension: this module is covered by `npm test`, which
// runs it straight through node, and node resolves neither the `@/` alias nor
// an extensionless specifier. Metro takes the explicit path as-is.
import {
  buildCustomInstallments,
  validateCustomRows,
} from "../../../services/custom-installments.ts";
import {
  flatEquivalentBps,
  generateInstallments,
  type GeneratedInstallment,
} from "../../../services/schedule-generator.ts";

/**
 * The wizard's state and the pure rules over it.
 *
 * Everything here is a plain function of a plain object: no hooks, no i18n, no
 * database. That is what lets step 3 preview the exact rows the service will
 * write — it calls the same `generateInstallments` / `buildCustomInstallments`
 * the service calls — and what lets the rules be unit-tested without a device.
 *
 * Validation returns error CODES, never sentences. The hook maps a code to a
 * translated message; this module has no opinion about language.
 */

export type CustomRowDraft = {
  /** Stable across removals — an index would move the wrong row's text. */
  key: number;
  dueDate: Date | null;
  amountValue: number | null;
};

export type DebtDraft = {
  direction: DebtDirection;
  /** Only ever passed through as `counterparty.presetKey`; nothing branches on it. */
  presetSlug: string | null;

  counterpartyId: number | null;
  counterpartyName: string;
  counterpartyKind: CounterpartyKind;
  title: string;
  principal: number | null;
  originDate: Date;
  walletId: number | null;
  recordCashFlow: boolean;
  note: string;

  scheduleType: ScheduleType;
  anchorDate: Date | null;
  dueDay: number | null;
  intervalUnit: IntervalUnit;
  intervalCount: number | null;
  periodCount: number | null;
  /**
   * What the user pays each period, copied off the lender's screen. When it is
   * set the schedule is built from it and the interest is derived; when it is
   * null the form is back to asking for a rate. See splitFixedAmounts.
   */
  installmentAmount: number | null;
  interestRateBps: number;
  interestMethod: InterestMethod;
  graceDays: number;
  reminderDays: number;
  roundingUnit: number;
  customRows: CustomRowDraft[];
};

export type DebtDraftField = keyof DebtDraft;

export type DebtDraftErrorCode =
  | "principalRequired"
  | "principalTooLarge"
  | "counterpartyRequired"
  | "counterpartyTooLong"
  | "titleRequired"
  | "titleTooLong"
  | "noteTooLong"
  | "anchorDateRequired"
  | "intervalCountInvalid"
  | "periodCountInvalid"
  | "dueDayInvalid"
  | "interestRateInvalid"
  | "installmentAmountRequired"
  | "installmentAmountTooSmall"
  | "customRowsRequired"
  | "customRowDateRequired"
  | "customRowAmountRequired";

export type DebtDraftErrors = Partial<
  Record<DebtDraftField, DebtDraftErrorCode>
>;

export const MAX_AMOUNT = 999_999_999_999;
const MAX_TITLE = 150;
const MAX_COUNTERPARTY = 80;
const MAX_NOTE = 500;
const MAX_INTERVAL_COUNT = 99;
const MAX_PERIOD_COUNT = 600;
/** 1000% per period — high enough for any real product, low enough to catch a typo. */
const MAX_RATE_BPS = 100_000;

/** Fields a preset is allowed to fill in, as long as the user has not. */
const PRESET_FIELDS = [
  "direction",
  "counterpartyKind",
  "title",
  "scheduleType",
  "intervalUnit",
  "intervalCount",
  "periodCount",
  "interestRateBps",
  "interestMethod",
  "dueDay",
  "graceDays",
  "reminderDays",
  "roundingUnit",
] as const satisfies readonly DebtDraftField[];

export function emptyDraft(direction: DebtDirection): DebtDraft {
  const today = new Date();

  return {
    direction,
    presetSlug: null,
    counterpartyId: null,
    counterpartyName: "",
    // The friendlier default: most debts a person records by hand are with
    // another person, and an institution is a deliberate choice.
    counterpartyKind: "person",
    title: "",
    principal: null,
    originDate: today,
    walletId: null,
    recordCashFlow: false,
    note: "",

    scheduleType: "open",
    anchorDate: null,
    dueDay: null,
    intervalUnit: "month",
    intervalCount: 1,
    periodCount: null,
    installmentAmount: null,
    interestRateBps: 0,
    interestMethod: "none",
    graceDays: 0,
    reminderDays: 3,
    roundingUnit: 1000,
    customRows: [],
  };
}

/**
 * Fills the form from a product, without ever overruling the user.
 *
 * Only fields absent from `touched` are seeded, so picking a different preset
 * re-seeds everything the user has not looked at, while a field they edited
 * stays theirs for good. Choosing a preset does not mark anything touched —
 * that would freeze the form after the first pick.
 *
 * `presetLabel` comes from the caller because labels are translated and this
 * module is not.
 */
export function applyPreset(
  draft: DebtDraft,
  preset: DebtPreset,
  touched: ReadonlySet<DebtDraftField>,
  presetLabel: string,
): DebtDraft {
  const seeded: Partial<DebtDraft> = {
    direction: preset.direction,
    counterpartyKind: preset.kind,
    title: presetLabel,
    scheduleType: preset.scheduleType,
    intervalUnit: preset.intervalUnit ?? draft.intervalUnit,
    intervalCount: preset.intervalCount ?? 1,
    periodCount: preset.periodCount,
    interestRateBps: preset.interestRateBps,
    interestMethod: preset.interestMethod,
    dueDay: preset.dueDay,
    graceDays: preset.graceDays,
    reminderDays: preset.reminderDays,
    roundingUnit: preset.roundingUnit,
  };

  const next: DebtDraft = { ...draft, presetSlug: preset.slug };

  for (const field of PRESET_FIELDS) {
    if (touched.has(field)) continue;
    Object.assign(next, { [field]: seeded[field] });
  }

  return next;
}

/** A blank row, dated one interval after the row it follows. */
export function emptyCustomRow(key: number, after: Date | null): CustomRowDraft {
  const base = after ?? new Date();
  return {
    key,
    dueDate: new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()),
    amountValue: null,
  };
}

/**
 * Every rule the form has, checked in one pass.
 *
 * One function rather than one per step: the form is a single screen, and a
 * rule that only fires once the user reaches some section is a rule that lets
 * an invalid draft reach submit.
 */
export function validateDraft(draft: DebtDraft): DebtDraftErrors {
  const errors: DebtDraftErrors = {};

  if (draft.principal === null || draft.principal <= 0) {
    errors.principal = "principalRequired";
  } else if (draft.principal > MAX_AMOUNT) {
    errors.principal = "principalTooLarge";
  }

  const name = draft.counterpartyName.trim();
  if (!draft.counterpartyId && !name) {
    errors.counterpartyName = "counterpartyRequired";
  } else if (name.length > MAX_COUNTERPARTY) {
    errors.counterpartyName = "counterpartyTooLong";
  }

  const title = draft.title.trim();
  if (!title) errors.title = "titleRequired";
  else if (title.length > MAX_TITLE) errors.title = "titleTooLong";

  if (draft.note.trim().length > MAX_NOTE) errors.note = "noteTooLong";

  if (draft.scheduleType === "single" && !draft.anchorDate) {
    errors.anchorDate = "anchorDateRequired";
  }

  if (draft.scheduleType === "recurring") {
    if (!draft.anchorDate) errors.anchorDate = "anchorDateRequired";

    const interval = draft.intervalCount ?? 0;
    if (interval < 1 || interval > MAX_INTERVAL_COUNT) {
      errors.intervalCount = "intervalCountInvalid";
    }

    const periods = draft.periodCount ?? 0;
    if (periods < 1 || periods > MAX_PERIOD_COUNT) {
      errors.periodCount = "periodCountInvalid";
    }

    if (draft.dueDay !== null && (draft.dueDay < 1 || draft.dueDay > 31)) {
      errors.dueDay = "dueDayInvalid";
    }
  }

  if (draft.scheduleType === "custom") {
    const rowError = validateCustomRows(toCustomRows(draft));
    if (rowError) {
      errors.customRows =
        rowError.code === "empty"
          ? "customRowsRequired"
          : rowError.code === "missingDate"
            ? "customRowDateRequired"
            : "customRowAmountRequired";
    }
  }

  if (
    draft.scheduleType !== "open" &&
    (draft.interestRateBps < 0 || draft.interestRateBps > MAX_RATE_BPS)
  ) {
    errors.interestRateBps = "interestRateInvalid";
  }

  Object.assign(errors, validateInstallmentAmount(draft));

  return errors;
}

/**
 * The fixed-instalment rules, kept apart because they only apply on that path.
 *
 * A schedule whose instalments do not reach the principal is not a cheap loan,
 * it is a typo — and letting it through would show negative interest on the
 * detail screen rather than an error where the number was typed.
 */
function validateInstallmentAmount(draft: DebtDraft): DebtDraftErrors {
  if (draft.scheduleType !== "recurring" && draft.scheduleType !== "single") {
    return {};
  }
  if (draft.installmentAmount === null) return {};

  if (draft.installmentAmount <= 0) {
    return { installmentAmount: "installmentAmountRequired" };
  }
  if (draft.installmentAmount > MAX_AMOUNT) {
    return { installmentAmount: "principalTooLarge" };
  }

  const periods = draft.scheduleType === "single" ? 1 : (draft.periodCount ?? 0);
  if (periods < 1 || draft.principal === null) return {};

  if (draft.installmentAmount * periods < draft.principal) {
    return { installmentAmount: "installmentAmountTooSmall" };
  }

  return {};
}

const toCustomRows = (draft: DebtDraft) =>
  draft.customRows.map((row) => ({
    dueDate: row.dueDate,
    totalAmount: row.amountValue,
  }));

/**
 * The rows this draft would produce, computed exactly the way the service will.
 *
 * Sharing the functions rather than reimplementing the arithmetic is the whole
 * point: a preview that disagrees with what gets saved is worse than no
 * preview, because the user checked it.
 */
export function previewInstallments(draft: DebtDraft): GeneratedInstallment[] {
  if (draft.scheduleType === "custom") {
    return buildCustomInstallments(toCustomRows(draft));
  }

  if (draft.principal === null || draft.principal <= 0) return [];

  return generateInstallments(
    {
      principal: draft.principal,
      interestRateBps: draft.interestRateBps,
      interestMethod: draft.interestMethod,
    },
    {
      scheduleType: draft.scheduleType,
      anchorDate: draft.anchorDate,
      dueDay: draft.dueDay,
      intervalUnit: draft.intervalUnit,
      intervalCount: draft.intervalCount,
      periodCount: draft.periodCount,
      roundingUnit: draft.roundingUnit,
      installmentAmount: draft.installmentAmount,
    },
  );
}

/**
 * What the debt header should record for interest.
 *
 * On the fixed-instalment path the user never states a rate, so it is derived
 * and the method is `manual` — the honest label for figures copied off the
 * lender's own screen. Otherwise the draft's own rate and method stand.
 */
export function interestFor(draft: DebtDraft): {
  interestRateBps: number;
  interestMethod: InterestMethod;
} {
  const periods =
    draft.scheduleType === "single" ? 1 : (draft.periodCount ?? 0);

  if (
    draft.installmentAmount !== null &&
    draft.installmentAmount > 0 &&
    draft.principal !== null &&
    periods >= 1 &&
    (draft.scheduleType === "recurring" || draft.scheduleType === "single")
  ) {
    return {
      interestRateBps: flatEquivalentBps(
        draft.principal,
        draft.installmentAmount,
        periods,
      ),
      interestMethod: "manual",
    };
  }

  return {
    interestRateBps: draft.interestRateBps,
    interestMethod: draft.interestMethod,
  };
}

/** The payload for `debtService.createDebt`. Assumes the draft has validated. */
export function toCreateDebtInput(draft: DebtDraft): CreateDebtInput {
  const name = draft.counterpartyName.trim();

  return {
    counterparty: draft.counterpartyId
      ? { id: draft.counterpartyId }
      : { name, kind: draft.counterpartyKind, presetKey: draft.presetSlug },
    direction: draft.direction,
    title: draft.title.trim(),
    principal: draft.principal ?? 0,
    ...interestFor(draft),
    originDate: draft.originDate,
    walletId: draft.walletId,
    note: draft.note,
    recordCashFlow: draft.recordCashFlow && draft.walletId !== null,
    schedule: {
      scheduleType: draft.scheduleType,
      // An `open` schedule has no anchor by definition; leaving a stale one
      // behind would trip the schedule's shape constraints.
      anchorDate: draft.scheduleType === "open" ? null : draft.anchorDate,
      dueDay: draft.scheduleType === "recurring" ? draft.dueDay : null,
      intervalUnit: draft.scheduleType === "recurring" ? draft.intervalUnit : null,
      intervalCount:
        draft.scheduleType === "recurring" ? (draft.intervalCount ?? 1) : null,
      periodCount:
        draft.scheduleType === "recurring" ? (draft.periodCount ?? 1) : null,
      // Kept so a later regenerate rebuilds the same rows: the generator reads
      // the schedule table, and without this it would fall back to the rate.
      installmentAmount:
        draft.scheduleType === "recurring" || draft.scheduleType === "single"
          ? draft.installmentAmount
          : null,
      graceDays: draft.graceDays,
      reminderDays: draft.reminderDays,
      roundingUnit: draft.roundingUnit,
    },
    customInstallments:
      draft.scheduleType === "custom"
        ? buildCustomInstallments(toCustomRows(draft)).map((row) => ({
            dueDate: row.dueDate as Date,
            totalAmount: row.totalAmount,
          }))
        : undefined,
  };
}

/**
 * "2,95" or "2.95" → 295 basis points.
 *
 * Both separators are accepted because the app runs in two locales and the
 * number pad on Android offers whichever the keyboard feels like.
 */
export function parsePercentToBps(value: string): number | null {
  const normalised = value.trim().replace(",", ".");
  if (!normalised) return 0;
  if (!/^\d*\.?\d*$/.test(normalised)) return null;

  const percent = Number(normalised);
  if (!Number.isFinite(percent) || percent < 0) return null;

  return Math.round(percent * 100);
}

/** 295 → "2.95", 100 → "1", 0 → "". */
export function formatBpsAsPercent(bps: number): string {
  if (!bps) return "";
  return String(Number((bps / 100).toFixed(2)));
}
