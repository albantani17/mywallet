import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { FrequentTransaction } from "@/db";
import { transactionService } from "@/services/transaction-service";

type PendingUndo = {
  id: number;
  /** What the chip called it, so the undo bar names the same thing. */
  label: string;
};

/**
 * Records a repeat of an existing transaction shape, and keeps it undoable.
 *
 * Saving on the first tap rather than opening a confirmation is the whole
 * point — it turns recording a habit into two interactions. The undo window is
 * what makes that safe: the chip shows its amount, so a wrong tap is visible
 * immediately and costs one more tap to reverse.
 */
export function useQuickRepeat() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingUndo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A ref, not the state flag: two taps in the same frame would both read a
  // stale `false` and insert the transaction twice.
  const isBusy = useRef(false);

  const repeat = useCallback(
    async (suggestion: FrequentTransaction, label: string) => {
      if (isBusy.current) return;
      isBusy.current = true;
      setError(null);

      try {
        const saved = await transactionService.createTransaction({
          type: suggestion.type,
          amount: suggestion.amount,
          walletId: suggestion.walletId,
          categoryId: suggestion.categoryId,
          note: suggestion.note,
          // The habit is repeated now; only its shape came from the past.
          occurredAt: new Date(),
        });
        setPending({ id: saved.id, label });
      } catch (e) {
        console.error("Failed to repeat the transaction", e);
        setError(t("dashboard.quickRepeat.failed"));
      } finally {
        isBusy.current = false;
      }
    },
    [t],
  );

  const undo = useCallback(async () => {
    // Cleared before the await: the bar has to disappear on the tap, not when
    // SQLite gets around to it.
    const target = pending;
    setPending(null);
    if (!target) return;

    try {
      await transactionService.deleteTransaction(target.id);
    } catch (e) {
      console.error("Failed to undo the repeated transaction", e);
      setError(t("dashboard.quickRepeat.undoFailed"));
    }
  }, [pending, t]);

  // Stable identity: the undo bar restarts its countdown whenever this changes.
  const dismiss = useCallback(() => setPending(null), []);

  return { repeat, undo, dismiss, pending, error };
}
