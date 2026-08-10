import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  applyPreset,
  emptyCustomRow,
  emptyDraft,
  MAX_AMOUNT,
  parsePercentToBps,
  previewInstallments,
  toCreateDebtInput,
  validateDraft,
  type CustomRowDraft,
  type DebtDraft,
  type DebtDraftErrorCode,
  type DebtDraftField,
} from "@/components/features/debts/debt-draft";
import type {
  CounterpartyKind,
  DebtDirection,
  DebtPreset,
  InterestMethod,
  IntervalUnit,
  ScheduleType,
} from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { debtService } from "@/services/debt-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<DebtDraftField | "form", string>>;

/**
 * State for the add-debt form.
 *
 * The rules live in `debt-draft.ts` as pure functions; this hook is the React
 * shell around them — which fields have been touched and how a validation code
 * becomes a sentence.
 */
export function useCreateDebt(
  initialDirection: DebtDirection,
  onSuccess?: () => void,
) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [draft, setDraft] = useState<DebtDraft>(() =>
    emptyDraft(initialDirection),
  );
  /**
   * Fields the user has edited by hand. A preset never overwrites one of
   * these — see applyPreset. Kept out of the draft because it is about how the
   * draft was reached, not about the debt.
   */
  const [touched, setTouched] = useState<ReadonlySet<DebtDraftField>>(
    () => new Set(),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Row identity has to survive a removal, so it cannot come from the index.
  const nextRowKey = useRef(1);

  /** Codes are translated in exactly one place, with literal keys. */
  const messageFor = useCallback(
    (code: DebtDraftErrorCode): string => {
      const messages: Record<DebtDraftErrorCode, string> = {
        principalRequired: t("newDebt.principalRequired"),
        principalTooLarge: t("newDebt.principalTooLarge"),
        counterpartyRequired: t("newDebt.counterpartyRequired"),
        counterpartyTooLong: t("newDebt.counterpartyTooLong"),
        titleRequired: t("newDebt.titleRequired"),
        titleTooLong: t("newDebt.titleTooLong"),
        noteTooLong: t("newDebt.noteTooLong"),
        anchorDateRequired: t("newDebt.anchorDateRequired"),
        intervalCountInvalid: t("newDebt.intervalCountInvalid"),
        periodCountInvalid: t("newDebt.periodCountInvalid"),
        dueDayInvalid: t("newDebt.dueDayInvalid"),
        interestRateInvalid: t("newDebt.interestRateInvalid"),
        installmentAmountRequired: t("newDebt.installmentAmountRequired"),
        installmentAmountTooSmall: t("newDebt.installmentAmountTooSmall"),
        customRowsRequired: t("newDebt.customRowsRequired"),
        customRowDateRequired: t("newDebt.customRowDateRequired"),
        customRowAmountRequired: t("newDebt.customRowAmountRequired"),
      };
      return messages[code];
    },
    [t],
  );

  const runValidation = useCallback(
    (source: DebtDraft): Errors | null => {
      const found = validateDraft(source);
      const entries = Object.entries(found) as [
        DebtDraftField,
        DebtDraftErrorCode,
      ][];
      if (entries.length === 0) return null;

      return Object.fromEntries(
        entries.map(([field, code]) => [field, messageFor(code)]),
      ) as Errors;
    },
    [messageFor],
  );

  /** Every edit records the field as the user's and clears its complaint. */
  const change = useCallback(
    <K extends DebtDraftField>(field: K, value: DebtDraft[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setTouched((current) => new Set(current).add(field));
      setErrors((current) => ({
        ...current,
        [field]: undefined,
        form: undefined,
      }));
    },
    [],
  );

  const changePrincipal = useCallback(
    (value: string) => {
      setErrors((current) => ({
        ...current,
        principal: undefined,
        form: undefined,
      }));
      setTouched((current) => new Set(current).add("principal"));

      if (value.trim() === "") {
        setDraft((current) => ({ ...current, principal: null }));
        return;
      }

      // Strips the separators the previous render added, so digits round-trip.
      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      // Keep what is typed rather than wiping it, and say why the extra digit
      // did not appear.
      if (Math.abs(parsed) > MAX_AMOUNT) {
        setErrors((current) => ({
          ...current,
          principal: t("newDebt.principalTooLarge"),
        }));
        return;
      }

      setDraft((current) => ({ ...current, principal: Math.abs(parsed) }));
    },
    [t],
  );

  /**
   * The instalment the lender quotes, e.g. "1.045.000".
   *
   * Emptying the field is meaningful: it hands the schedule back to the
   * rate-driven path rather than leaving a stale figure generating the rows.
   */
  const changeInstallmentAmount = useCallback(
    (value: string) => {
      setErrors((current) => ({
        ...current,
        installmentAmount: undefined,
        form: undefined,
      }));
      setTouched((current) => new Set(current).add("installmentAmount"));

      if (value.trim() === "") {
        setDraft((current) => ({ ...current, installmentAmount: null }));
        return;
      }

      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      if (Math.abs(parsed) > MAX_AMOUNT) {
        setErrors((current) => ({
          ...current,
          installmentAmount: t("newDebt.principalTooLarge"),
        }));
        return;
      }

      setDraft((current) => ({
        ...current,
        installmentAmount: Math.abs(parsed),
        // A quoted instalment is the whole obligation, so any rate left in the
        // advanced section would double-charge if it stayed in play.
        interestRateBps: 0,
        interestMethod: "none",
      }));
    },
    [t],
  );

  const changeInterestRate = useCallback((value: string) => {
    const bps = parsePercentToBps(value);
    if (bps === null) return;

    setDraft((current) => ({
      ...current,
      // The mirror of changeInstallmentAmount: stating a rate is how the user
      // says the schedule should be computed rather than copied.
      installmentAmount: bps > 0 ? null : current.installmentAmount,
      interestRateBps: bps,
      // A rate with no method to apply it would never be charged, which
      // reads as the app losing the user's interest. The DB refuses it too.
      interestMethod:
        bps > 0 && current.interestMethod === "none"
          ? "flat"
          : bps === 0
            ? "none"
            : current.interestMethod,
    }));
    setTouched((current) => new Set(current).add("interestRateBps"));
    setErrors((current) => ({
      ...current,
      interestRateBps: undefined,
      form: undefined,
    }));
  }, []);

  const choosePreset = useCallback(
    (preset: DebtPreset | null, label: string) => {
      if (!preset) {
        setDraft((current) => ({ ...current, presetSlug: null }));
        return;
      }

      setDraft((current) => applyPreset(current, preset, touched, label));
      setErrors({});
    },
    [touched],
  );

  const chooseCounterparty = useCallback(
    (id: number | null, name: string, kind: CounterpartyKind) => {
      setDraft((current) => ({
        ...current,
        counterpartyId: id,
        counterpartyName: name,
        counterpartyKind: kind,
      }));
      setTouched((current) => new Set(current).add("counterpartyKind"));
      setErrors((current) => ({
        ...current,
        counterpartyName: undefined,
        form: undefined,
      }));
    },
    [],
  );

  const changeCounterpartyName = useCallback((value: string) => {
    // Typing over a picked party turns it back into a find-or-create by
    // name; leaving the id attached would silently ignore what was typed.
    setDraft((current) => ({
      ...current,
      counterpartyName: value,
      counterpartyId: null,
    }));
    setTouched((current) => new Set(current).add("counterpartyName"));
    setErrors((current) => ({
      ...current,
      counterpartyName: undefined,
      form: undefined,
    }));
  }, []);

  const addCustomRow = useCallback(() => {
    setDraft((current) => {
      const last = current.customRows.at(-1);
      const row = emptyCustomRow(
        nextRowKey.current,
        last?.dueDate ?? current.originDate,
      );
      nextRowKey.current += 1;
      return { ...current, customRows: [...current.customRows, row] };
    });
    setErrors((current) => ({
      ...current,
      customRows: undefined,
      form: undefined,
    }));
  }, []);

  const changeCustomRow = useCallback(
    (key: number, patch: Partial<Omit<CustomRowDraft, "key">>) => {
      setDraft((current) => ({
        ...current,
        customRows: current.customRows.map((row) =>
          row.key === key ? { ...row, ...patch } : row,
        ),
      }));
      setErrors((current) => ({
        ...current,
        customRows: undefined,
        form: undefined,
      }));
    },
    [],
  );

  const removeCustomRow = useCallback((key: number) => {
    setDraft((current) => ({
      ...current,
      customRows: current.customRows.filter((row) => row.key !== key),
    }));
  }, []);

  /**
   * Switching schedule type keeps the amount, the party and the note — only
   * the fields the new type cannot express are dropped, and the custom editor
   * is seeded with one row so it is never an empty box.
   */
  const changeScheduleType = useCallback((scheduleType: ScheduleType) => {
    setDraft((current) => {
      const next: DebtDraft = { ...current, scheduleType };

      if (scheduleType === "open") {
        next.anchorDate = null;
      } else if (!next.anchorDate) {
        next.anchorDate = current.originDate;
      }

      if (scheduleType === "recurring" && !next.periodCount) {
        next.periodCount = 3;
      }

      // Neither shape has a repeating instalment to quote: an open debt has no
      // periods, and a custom one carries its amounts on the rows themselves.
      if (scheduleType === "open" || scheduleType === "custom") {
        next.installmentAmount = null;
      }

      if (scheduleType === "custom" && current.customRows.length === 0) {
        next.customRows = [
          emptyCustomRow(nextRowKey.current, current.originDate),
        ];
        nextRowKey.current += 1;
      }

      return next;
    });
    setTouched((current) => new Set(current).add("scheduleType"));
    setErrors({});
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    // Validated on press rather than by disabling the button: a dead button
    // with no explanation is the worse failure.
    const found = runValidation(draft);
    if (found) {
      setErrors(found);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await debtService.createDebt(toCreateDebtInput(draft));
      // Always clear the flag. Leaving it set to "wait for the unmount" locks
      // the button forever whenever the caller does not navigate away.
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to create the debt", e);
      setErrors({ form: t("newDebt.failed") });
      setIsSubmitting(false);
    }
  }, [draft, isSubmitting, onSuccess, runValidation, t]);

  return {
    draft,
    errors,
    isSubmitting,
    // 10000000 → "10.000.000" in ID, "10,000,000" in EN.
    principal:
      draft.principal === null ? "" : formatAmount(draft.principal, locale),
    installmentAmount:
      draft.installmentAmount === null
        ? ""
        : formatAmount(draft.installmentAmount, locale),
    preview: previewInstallments(draft),

    change,
    changePrincipal,
    changeInstallmentAmount,
    changeInterestRate,
    changeCounterpartyName,
    changeScheduleType,
    choosePreset,
    chooseCounterparty,
    addCustomRow,
    changeCustomRow,
    removeCustomRow,
    submit,
  };
}

export type CreateDebtForm = ReturnType<typeof useCreateDebt>;
export type { CounterpartyKind, InterestMethod, IntervalUnit, ScheduleType };
