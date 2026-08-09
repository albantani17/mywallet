import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { InstallmentWithPaid, PaymentMethod } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { debtService } from "@/services/debt-service";
import {
  allocationError,
  planAllocation,
  type AllocationErrorCode,
  type AllocationInput,
} from "@/services/payment-allocator";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<"amount" | "note" | "allocation" | "form", string>>;

const MAX_AMOUNT = 999_999_999_999;
const MAX_NOTE_LENGTH = 200;

type RecordPaymentOptions = {
  debtId: number;
  installments: InstallmentWithPaid[];
  /** What is still owed — seeds the amount field once. */
  outstanding: number;
};

/**
 * Form state for recording a payment.
 *
 * The allocation preview is computed here with `planAllocation`, the same pure
 * function `recordPayment` runs inside its transaction — not through
 * `debtService.previewAllocation`, which would be a database round trip racing
 * the live installment query. What the user sees is what gets written.
 */
export function useRecordPayment(
  { debtId, installments, outstanding }: RecordPaymentOptions,
  onSuccess?: () => void,
) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [amountValue, setAmountValue] = useState<number | null>(null);
  /** Once the user has touched the field, the seed must never fire again. */
  const [hasEditedAmount, setHasEditedAmount] = useState(false);
  const [paidAt, setPaidAt] = useState<Date>(() => new Date());
  const [walletId, setWalletId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [recordCashFlow, setRecordCashFlow] = useState(true);
  const [note, setNote] = useState("");
  const [isManualOpen, setIsManualOpen] = useState(false);
  /** Manual overrides, keyed by installment id. Empty until the section opens. */
  const [manual, setManual] = useState<Record<number, number | null>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paying the lot is the common case, so the field starts there. It waits for
  // the installments to load, and stops the moment the user types.
  useEffect(() => {
    if (hasEditedAmount || outstanding <= 0) return;
    setAmountValue((current) => (current === null ? outstanding : current));
  }, [hasEditedAmount, outstanding]);

  const amount = amountValue === null ? "" : formatAmount(amountValue, locale);

  const autoPlan = planAllocation(amountValue ?? 0, installments);

  const manualAllocations: AllocationInput[] = Object.entries(manual)
    .filter(([, value]) => value !== null && value > 0)
    .map(([installmentId, value]) => ({
      installmentId: Number(installmentId),
      amount: value as number,
    }));

  const allocations = isManualOpen ? manualAllocations : autoPlan.allocations;
  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const unallocated = Math.max((amountValue ?? 0) - allocated, 0);

  const codedError = allocationError(
    amountValue ?? 0,
    allocations,
    installments,
  );

  const messageForCode = useCallback(
    (code: AllocationErrorCode, sequence?: number) => {
      const messages: Record<AllocationErrorCode, string> = {
        nonPositive: t("newPayment.errorNonPositive"),
        exceedsPayment: t("newPayment.errorExceedsPayment"),
        unknownInstallment: t("newPayment.errorUnknownInstallment"),
        overpaidInstallment: t("newPayment.errorOverpaid", { sequence }),
        duplicateInstallment: t("newPayment.errorDuplicate"),
      };
      return messages[code];
    },
    [t],
  );

  /** Shown live under the manual editor; the same check gates submit. */
  const allocationMessage = codedError
    ? messageForCode(codedError.code, codedError.sequence)
    : null;

  const changeAmount = useCallback((value: string) => {
    setHasEditedAmount(true);
    setErrors((current) => ({ ...current, amount: undefined, form: undefined }));

    if (value.trim() === "") {
      setAmountValue(null);
      return;
    }

    const parsed = parseAmountInput(value);
    if (parsed === null) return;
    if (Math.abs(parsed) > MAX_AMOUNT) return;

    setAmountValue(Math.abs(parsed));
  }, []);

  const changeWalletId = useCallback((value: number) => {
    setWalletId(value);
    setErrors((current) => ({ ...current, form: undefined }));
  }, []);

  const changeNote = useCallback((value: string) => {
    setNote(value);
    setErrors((current) => ({ ...current, note: undefined, form: undefined }));
  }, []);

  /**
   * Opening the editor seeds it from the automatic split — editing a proposal
   * is far easier than filling an empty grid. Closing it clears the overrides,
   * so submitting reverts to automatic rather than to a half-typed grid the
   * user can no longer see.
   */
  const toggleManual = useCallback(() => {
    setIsManualOpen((open) => {
      if (open) {
        setManual({});
        return false;
      }

      setManual(
        Object.fromEntries(
          autoPlan.allocations.map((a) => [a.installmentId, a.amount]),
        ),
      );
      return true;
    });
    setErrors((current) => ({ ...current, allocation: undefined }));
  }, [autoPlan.allocations]);

  const resetManual = useCallback(() => {
    setManual(
      Object.fromEntries(
        autoPlan.allocations.map((a) => [a.installmentId, a.amount]),
      ),
    );
    setErrors((current) => ({ ...current, allocation: undefined }));
  }, [autoPlan.allocations]);

  const changeManualAmount = useCallback(
    (installmentId: number, value: string) => {
      setErrors((current) => ({
        ...current,
        allocation: undefined,
        form: undefined,
      }));

      if (value.trim() === "") {
        setManual((current) => ({ ...current, [installmentId]: null }));
        return;
      }

      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      setManual((current) => ({ ...current, [installmentId]: Math.abs(parsed) }));
    },
    [],
  );

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const nextErrors: Errors = {};

    if (amountValue === null || amountValue <= 0) {
      nextErrors.amount = t("newPayment.amountRequired");
    } else if (amountValue > MAX_AMOUNT) {
      nextErrors.amount = t("newPayment.amountTooLarge");
    }

    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = t("newPayment.noteTooLong");
    }

    if (isManualOpen) {
      if (manualAllocations.length === 0) {
        nextErrors.allocation = t("newPayment.errorNoAllocation");
      } else if (codedError) {
        nextErrors.allocation = messageForCode(
          codedError.code,
          codedError.sequence,
        );
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await debtService.recordPayment({
        debtId,
        amount: amountValue as number,
        paidAt,
        walletId,
        method,
        note,
        // Omitted in automatic mode so the service plans against the rows as
        // they are inside its own transaction, not against this snapshot.
        allocations: isManualOpen ? manualAllocations : undefined,
        recordCashFlow: recordCashFlow && walletId !== null,
      });
      // Always clear the flag: leaving it set to "wait for the unmount" locks
      // the button forever when the caller does not navigate away.
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to record the payment", e);
      setErrors({ form: t("newPayment.failed") });
      setIsSubmitting(false);
    }
  }, [
    amountValue,
    codedError,
    debtId,
    isManualOpen,
    isSubmitting,
    manualAllocations,
    messageForCode,
    method,
    note,
    onSuccess,
    paidAt,
    recordCashFlow,
    t,
    walletId,
  ]);

  return {
    amount,
    amountValue,
    paidAt,
    walletId,
    method,
    recordCashFlow,
    note,
    isManualOpen,
    manual,
    allocations,
    allocated,
    unallocated,
    allocationMessage,
    errors,
    isSubmitting,

    changeAmount,
    changePaidAt: setPaidAt,
    changeWalletId,
    changeMethod: setMethod,
    changeRecordCashFlow: setRecordCashFlow,
    changeNote,
    toggleManual,
    resetManual,
    changeManualAmount,
    submit,
  };
}

export type RecordPaymentForm = ReturnType<typeof useRecordPayment>;
