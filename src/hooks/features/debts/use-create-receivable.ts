import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useActiveLocale } from "@/hooks/use-active-locale";
import { debtService } from "@/services/debt-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<
  Record<"amount" | "counterparty" | "wallet" | "note" | "form", string>
>;

/** Guards the integer column against an absurd amount. */
const MAX_AMOUNT = 999_999_999_999;
const MAX_NAME_LENGTH = 80;
const MAX_NOTE_LENGTH = 200;

/**
 * Form state for lending money out.
 *
 * Mirrors useCreateTransaction: the amount is held as a number and the
 * separated string is derived, so it reformats itself when the language
 * changes.
 */
export function useCreateReceivable(onSuccess?: () => void) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [amountValue, setAmountValue] = useState<number | null>(null);
  const [counterparty, setCounterparty] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [issuedAt, setIssuedAt] = useState<Date>(() => new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1000000 → "1.000.000" in ID, "1,000,000" in EN.
  const amount = amountValue === null ? "" : formatAmount(amountValue, locale);

  const changeAmount = useCallback(
    (value: string) => {
      setErrors((prev) => ({ ...prev, amount: undefined, form: undefined }));

      if (value.trim() === "") {
        setAmountValue(null);
        return;
      }

      // Strips the separators the previous render added, so the digits
      // round-trip.
      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      // Keep what is already typed rather than wiping it, and say why the
      // extra digit did not appear.
      if (Math.abs(parsed) > MAX_AMOUNT) {
        setErrors((prev) => ({
          ...prev,
          amount: t("newReceivable.amountTooLarge"),
        }));
        return;
      }

      setAmountValue(Math.abs(parsed));
    },
    [t],
  );

  const changeCounterparty = useCallback((value: string) => {
    setCounterparty(value);
    setErrors((prev) => ({ ...prev, counterparty: undefined, form: undefined }));
  }, []);

  const changeWalletId = useCallback((value: number) => {
    setWalletId(value);
    setErrors((prev) => ({ ...prev, wallet: undefined, form: undefined }));
  }, []);

  const changeNote = useCallback((value: string) => {
    setNote(value);
    setErrors((prev) => ({ ...prev, note: undefined, form: undefined }));
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const nextErrors: Errors = {};

    if (amountValue === null || amountValue <= 0) {
      nextErrors.amount = t("newReceivable.amountRequired");
    }
    if (counterparty.trim().length === 0) {
      nextErrors.counterparty = t("newReceivable.counterpartyRequired");
    } else if (counterparty.trim().length > MAX_NAME_LENGTH) {
      nextErrors.counterparty = t("newReceivable.counterpartyTooLong");
    }
    if (walletId === null) {
      nextErrors.wallet = t("newReceivable.walletRequired");
    }
    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = t("newReceivable.noteTooLong");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await debtService.createReceivable({
        principal: amountValue as number,
        counterparty,
        walletId: walletId as number,
        issuedAt,
        dueDate,
        note,
      });
      // Always clear the flag. Leaving it set to "wait for the unmount" locks
      // the button forever whenever the caller does not navigate away.
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to create the receivable", e);
      setErrors({ form: t("newReceivable.failed") });
      setIsSubmitting(false);
    }
  }, [
    amountValue,
    counterparty,
    dueDate,
    issuedAt,
    isSubmitting,
    note,
    onSuccess,
    t,
    walletId,
  ]);

  return {
    amount,
    counterparty,
    walletId,
    issuedAt,
    dueDate,
    note,
    errors,
    isSubmitting,
    changeAmount,
    changeCounterparty,
    changeWalletId,
    changeIssuedAt: setIssuedAt,
    changeDueDate: setDueDate,
    changeNote,
    submit,
  };
}
