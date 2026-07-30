import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { DebtWithOutstanding } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { debtService } from "@/services/debt-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<"amount" | "wallet" | "note" | "form", string>>;

/** Guards the integer column against an absurd amount. */
const MAX_AMOUNT = 999_999_999_999;
const MAX_NOTE_LENGTH = 200;

/**
 * Form state for repaying a debt.
 *
 * The amount starts at whatever is still owed, since paying the rest is by far
 * the common case — but it stays editable, so a partial payment or a rounded-up
 * one is just a matter of retyping it.
 */
export function usePayReceivable(
  debt: DebtWithOutstanding | null,
  onSuccess?: () => void,
) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const outstanding = debt ? Math.max(Number(debt.outstanding), 0) : 0;

  // Seeded once from the outstanding balance. Re-seeding whenever the live
  // query re-runs would overwrite what the user is in the middle of typing.
  const [amountValue, setAmountValue] = useState<number | null>(null);
  const [hasEditedAmount, setHasEditedAmount] = useState(false);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [occurredAt, setOccurredAt] = useState<Date>(() => new Date());
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveAmount = hasEditedAmount ? amountValue : outstanding;
  const amount =
    effectiveAmount === null || effectiveAmount === 0
      ? ""
      : formatAmount(effectiveAmount, locale);

  const changeAmount = useCallback(
    (value: string) => {
      setHasEditedAmount(true);
      setErrors((prev) => ({ ...prev, amount: undefined, form: undefined }));

      if (value.trim() === "") {
        setAmountValue(null);
        return;
      }

      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      if (Math.abs(parsed) > MAX_AMOUNT) {
        setErrors((prev) => ({
          ...prev,
          amount: t("payReceivable.amountTooLarge"),
        }));
        return;
      }

      setAmountValue(Math.abs(parsed));
    },
    [t],
  );

  const changeWalletId = useCallback((value: number) => {
    setWalletId(value);
    setErrors((prev) => ({ ...prev, wallet: undefined, form: undefined }));
  }, []);

  const changeNote = useCallback((value: string) => {
    setNote(value);
    setErrors((prev) => ({ ...prev, note: undefined, form: undefined }));
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting || !debt) return;

    const nextErrors: Errors = {};

    if (effectiveAmount === null || effectiveAmount <= 0) {
      nextErrors.amount = t("payReceivable.amountRequired");
    }
    if (walletId === null) {
      nextErrors.wallet = t("payReceivable.walletRequired");
    }
    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = t("payReceivable.noteTooLong");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await debtService.recordPayment({
        debtId: debt.id,
        amount: effectiveAmount as number,
        walletId: walletId as number,
        occurredAt,
        note,
      });
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to record the payment", e);
      setErrors({ form: t("payReceivable.failed") });
      setIsSubmitting(false);
    }
  }, [debt, effectiveAmount, isSubmitting, note, occurredAt, onSuccess, t, walletId]);

  return {
    amount,
    outstanding,
    // Drives the "this settles the debt" hint under the amount field.
    willSettle: effectiveAmount !== null && effectiveAmount >= outstanding,
    walletId,
    occurredAt,
    note,
    errors,
    isSubmitting,
    changeAmount,
    changeWalletId,
    changeOccurredAt: setOccurredAt,
    changeNote,
    submit,
  };
}
