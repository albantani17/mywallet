import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { InstallmentWithPaid } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { debtService } from "@/services/debt-service";
import { formatAmount, formatCurrency, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<"amount" | "note" | "form", string>>;

const MAX_AMOUNT = 999_999_999_999;
const MAX_NOTE_LENGTH = 500;

/**
 * Editing one installment by hand: a moved date, a renegotiated amount, a late
 * fee.
 *
 * The write always sets `isModified`, which is what stops a later regenerate
 * from overwriting the change — so this is the one place a formula's output
 * can be corrected and made to stick.
 */
export function useEditInstallment(
  installment: InstallmentWithPaid,
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [dueDate, setDueDate] = useState<Date | null>(installment.dueDate);
  const [amountValue, setAmountValue] = useState<number | null>(
    installment.totalAmount,
  );
  const [note, setNote] = useState(installment.note ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = amountValue === null ? "" : formatAmount(amountValue, locale);

  const changeAmount = useCallback(
    (value: string) => {
      setErrors((current) => ({ ...current, amount: undefined, form: undefined }));

      if (value.trim() === "") {
        setAmountValue(null);
        return;
      }

      const parsed = parseAmountInput(value);
      if (parsed === null) return;
      if (Math.abs(parsed) > MAX_AMOUNT) return;

      setAmountValue(Math.abs(parsed));
    },
    [],
  );

  const changeNote = useCallback((value: string) => {
    setNote(value);
    setErrors((current) => ({ ...current, note: undefined, form: undefined }));
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const nextErrors: Errors = {};

    if (amountValue === null || amountValue <= 0) {
      nextErrors.amount = t("debtDetail.editInstallment.amountRequired");
    } else if (amountValue < installment.paidAmount) {
      // Below what has already landed, `remaining` clamps to zero and the row
      // reads as paid while money is still owed on it.
      nextErrors.amount = t("debtDetail.editInstallment.belowPaid", {
        amount: formatCurrency(installment.paidAmount, locale),
      });
    }

    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = t("debtDetail.editInstallment.noteTooLong");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const total = amountValue as number;
    // The components have to keep summing to the total, so the whole delta
    // goes to principal — interest and fees were quoted by the lender and are
    // not ours to rewrite. Floored, since a total below the interest already
    // charged would otherwise produce a negative principal.
    const principalAmount = Math.max(
      installment.principalAmount + (total - installment.totalAmount),
      0,
    );

    setIsSubmitting(true);
    try {
      await debtService.editInstallment(installment.id, {
        dueDate,
        totalAmount: total,
        principalAmount,
        note: note.trim() ? note.trim() : null,
      });
      setIsSubmitting(false);
      onSaved();
    } catch (e) {
      console.error("Failed to edit the installment", e);
      setErrors({ form: t("debtDetail.editInstallment.failed") });
      setIsSubmitting(false);
    }
  }, [
    amountValue,
    dueDate,
    installment,
    isSubmitting,
    locale,
    note,
    onSaved,
    t,
  ]);

  return {
    dueDate,
    amount,
    note,
    errors,
    isSubmitting,
    changeDueDate: setDueDate,
    changeAmount,
    changeNote,
    submit,
  };
}
