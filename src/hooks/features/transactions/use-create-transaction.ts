import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CategoryType, TransactionType } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { transactionService } from "@/services/transaction-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<
  Record<
    "amount" | "wallet" | "toWallet" | "category" | "fee" | "note" | "form",
    string
  >
>;

/** Guards the integer column against an absurd amount. */
const MAX_AMOUNT = 999_999_999_999;
const MAX_NOTE_LENGTH = 200;

/**
 * Which category list a transaction type draws from. A transfer moves money
 * between two of the user's own wallets, so it is not spending or earning and
 * carries no category at all — the DB enforces that with transfer_shape.
 */
export function categoryTypeFor(type: TransactionType): CategoryType | null {
  return type === "transfer" ? null : type;
}

/**
 * Form state for recording a transaction, across all four types.
 *
 * One state object rather than a form per type: the four differ only in which
 * fields they show, and keeping the amount and date while the user switches
 * type is the behaviour people expect. Switching does clear the fields that
 * would no longer make sense (see changeType).
 */
export function useCreateTransaction(onSuccess?: () => void) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [type, setType] = useState<TransactionType>("expense");
  // Amounts are held as numbers, not the typed text: the separated strings are
  // derived below, so they reformat themselves when the language changes.
  const [amountValue, setAmountValue] = useState<number | null>(null);
  const [feeValue, setFeeValue] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [occurredAt, setOccurredAt] = useState<Date>(() => new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1000000 → "1.000.000" in ID, "1,000,000" in EN.
  const amount = amountValue === null ? "" : formatAmount(amountValue, locale);
  const fee = feeValue === null ? "" : formatAmount(feeValue, locale);

  /**
   * Clears whatever the new type cannot carry. Without this a category picked
   * as an expense would survive a switch to transfer and be rejected by the
   * transfer_shape constraint — and a category of the wrong type would be
   * invisible in the picker while still being submitted.
   */
  const changeType = useCallback((next: TransactionType) => {
    setType(next);
    setCategoryId(null);
    setToWalletId(null);
    setFeeValue(null);
    setDueDate(null);
    setErrors({});
  }, []);

  // Both amount fields parse the same way; only the error slot differs.
  const makeAmountChanger = (
    setValue: (value: number | null) => void,
    field: "amount" | "fee",
  ) =>
    function change(value: string) {
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));

      if (value.trim() === "") {
        setValue(null);
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
          [field]: t("newTransaction.amountTooLarge"),
        }));
        return;
      }

      setValue(Math.abs(parsed));
    };

  const changeAmount = makeAmountChanger(setAmountValue, "amount");
  const changeFee = makeAmountChanger(setFeeValue, "fee");

  const changeWalletId = useCallback((value: number) => {
    setWalletId(value);
    setErrors((prev) => ({ ...prev, wallet: undefined, form: undefined }));
    // A transfer to the wallet just chosen as the source is not a transfer.
    setToWalletId((current) => (current === value ? null : current));
  }, []);

  const changeToWalletId = useCallback((value: number) => {
    setToWalletId(value);
    setErrors((prev) => ({ ...prev, toWallet: undefined, form: undefined }));
  }, []);

  const changeCategoryId = useCallback((value: number) => {
    setCategoryId(value);
    setErrors((prev) => ({ ...prev, category: undefined, form: undefined }));
  }, []);

  const changeNote = useCallback((value: string) => {
    setNote(value);
    setErrors((prev) => ({ ...prev, note: undefined, form: undefined }));
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const isTransfer = type === "transfer";
    const nextErrors: Errors = {};

    if (amountValue === null || amountValue <= 0) {
      nextErrors.amount = t("newTransaction.amountRequired");
    }
    if (walletId === null) {
      nextErrors.wallet = t("newTransaction.walletRequired");
    }
    if (isTransfer) {
      if (toWalletId === null) {
        nextErrors.toWallet = t("newTransaction.toWalletRequired");
      } else if (toWalletId === walletId) {
        nextErrors.toWallet = t("newTransaction.sameWallet");
      }
    } else if (categoryId === null) {
      nextErrors.category = t("newTransaction.categoryRequired");
    }
    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = t("newTransaction.noteTooLong");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // The service normalises the payload per type, so the fields this type
      // does not use need no clearing here.
      await transactionService.createTransaction({
        type,
        amount: amountValue as number,
        walletId: walletId as number,
        toWalletId,
        categoryId,
        fee: feeValue,
        note,
        occurredAt,
        dueDate,
      });
      // Always clear the flag. Leaving it set to "wait for the unmount" locks
      // the button forever whenever the caller does not navigate away.
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to create the transaction", e);
      setErrors({ form: t("newTransaction.failed") });
      setIsSubmitting(false);
    }
  }, [
    amountValue,
    categoryId,
    dueDate,
    feeValue,
    isSubmitting,
    note,
    occurredAt,
    onSuccess,
    t,
    toWalletId,
    type,
    walletId,
  ]);

  return {
    type,
    amount,
    fee,
    walletId,
    toWalletId,
    categoryId,
    occurredAt,
    dueDate,
    note,
    errors,
    isSubmitting,
    changeType,
    changeAmount,
    changeFee,
    changeWalletId,
    changeToWalletId,
    changeCategoryId,
    changeOccurredAt: setOccurredAt,
    changeDueDate: setDueDate,
    changeNote,
    submit,
  };
}
