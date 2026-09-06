import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CategoryType, TransactionType } from "@/db";
import { useDefaultWallet } from "@/hooks/features/transactions/use-default-wallet";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { transactionService } from "@/services/transaction-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<
  Record<"amount" | "wallet" | "toWallet" | "fee" | "note" | "form", string>
>;

/**
 * The fields a caller may pre-fill.
 *
 * Every quick way into this form — a repeat chip, a parsed sentence, later a
 * captured notification — produces one of these and hands it over, so they all
 * share this hook's normalisation instead of writing their own.
 */
export type TransactionDraft = {
  type: TransactionType;
  amount: number | null;
  fee: number | null;
  walletId: number | null;
  toWalletId: number | null;
  categoryId: number | null;
  occurredAt: Date;
  dueDate: Date | null;
  note: string;
};

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
export function useCreateTransaction(
  onSuccess?: () => void,
  initial?: Partial<TransactionDraft>,
) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  // `initial` is read on mount only, which is what a seed should be: the user
  // must be able to edit every field afterwards without it snapping back.
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  // Amounts are held as numbers, not the typed text: the separated strings are
  // derived below, so they reformat themselves when the language changes.
  const [amountValue, setAmountValue] = useState<number | null>(
    initial?.amount ?? null,
  );
  const [feeValue, setFeeValue] = useState<number | null>(initial?.fee ?? null);
  const [walletId, setWalletId] = useState<number | null>(
    initial?.walletId ?? null,
  );
  const [toWalletId, setToWalletId] = useState<number | null>(
    initial?.toWalletId ?? null,
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.categoryId ?? null,
  );
  const [occurredAt, setOccurredAt] = useState<Date>(
    () => initial?.occurredAt ?? new Date(),
  );
  const [dueDate, setDueDate] = useState<Date | null>(initial?.dueDate ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultWallet = useDefaultWallet(type);
  // A seeded wallet may be replaced by a better guess; a chosen one may not.
  // Seeded from `initial` too: a repeat chip already knows its wallet, and
  // re-deriving one would change the very thing the chip promised to repeat.
  const isWalletChosen = useRef(initial?.walletId != null);

  // The type is the first field on the form, so switching to income right after
  // opening is the normal way to record a salary — and the default has to
  // follow, or that salary lands in whatever wallet the last coffee came from.
  useEffect(() => {
    if (isWalletChosen.current || defaultWallet.walletId === null) return;
    setWalletId(defaultWallet.walletId);
  }, [defaultWallet.walletId]);

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
    isWalletChosen.current = true;
    setWalletId(value);
    setErrors((prev) => ({ ...prev, wallet: undefined, form: undefined }));
    // A transfer to the wallet just chosen as the source is not a transfer.
    setToWalletId((current) => (current === value ? null : current));
  }, []);

  const changeToWalletId = useCallback((value: number) => {
    setToWalletId(value);
    setErrors((prev) => ({ ...prev, toWallet: undefined, form: undefined }));
  }, []);

  // No category error to clear: an uncategorised transaction is legal, and the
  // list and the insights have always rendered one (transaction-row falls back
  // to transactions.uncategorized, insight.ts groups a null categoryId).
  const changeCategoryId = useCallback((value: number) => {
    setCategoryId(value);
    setErrors((prev) => ({ ...prev, form: undefined }));
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
