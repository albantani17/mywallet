import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { FrequentTransaction } from "@/db";
import { transactionService } from "@/services/transaction-service";

type PendingRepeat = {
  suggestion: FrequentTransaction;
  /** What the chip called it, so the confirm sheet names the same thing. */
  label: string;
};

/**
 * Records a repeat of an existing transaction shape, behind a confirmation.
 *
 * The chip carries a complete, valid transaction, so a stray tap on the strip
 * would otherwise write a real transaction with nothing entered. `request`
 * only stages the shape; `confirm` is the one that commits it, once the sheet
 * has shown the user what they are about to record.
 */
export function useQuickRepeat() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState<PendingRepeat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref, not the state flag: two taps in the same frame would both read a
  // stale `false` and insert the transaction twice.
  const isBusy = useRef(false);

  const request = useCallback((suggestion: FrequentTransaction, label: string) => {
    setError(null);
    setConfirming({ suggestion, label });
  }, []);

  const cancel = useCallback(() => {
    setConfirming(null);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (isBusy.current || !confirming) return;
    isBusy.current = true;
    setIsSubmitting(true);
    setError(null);

    const { suggestion } = confirming;

    try {
      await transactionService.createTransaction({
        type: suggestion.type,
        amount: suggestion.amount,
        walletId: suggestion.walletId,
        categoryId: suggestion.categoryId,
        note: suggestion.note,
        // The habit is repeated now; only its shape came from the past.
        occurredAt: new Date(),
      });
      setConfirming(null);
    } catch (e) {
      console.error("Failed to repeat the transaction", e);
      setError(t("dashboard.quickRepeat.failed"));
    } finally {
      isBusy.current = false;
      setIsSubmitting(false);
    }
  }, [confirming, t]);

  return { request, confirm, cancel, confirming, isSubmitting, error };
}
