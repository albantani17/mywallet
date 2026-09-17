import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { transactionService } from "@/services/transaction-service";

/** Handles the irreversible write and keeps the confirmation usable on error. */
export function useDeleteTransaction(onRemoved: () => void) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remove = useCallback(
    async (id: number) => {
      if (isSubmitting) return;

      setError(null);
      setIsSubmitting(true);
      try {
        await transactionService.deleteTransaction(id);
        onRemoved();
      } catch (cause) {
        console.error("Failed to remove the transaction", cause);
        // The service is also the final guard for a row that changed after the
        // menu opened. Its detail stays in the debt module; this screen only
        // needs a client-safe retry message.
        setError(t("transactions.delete.failed"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onRemoved, t],
  );

  return { error, isSubmitting, remove };
}
