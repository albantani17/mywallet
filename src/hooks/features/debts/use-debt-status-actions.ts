import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { debtService } from "@/services/debt-service";

/**
 * The three writes behind the confirmation sheets: close a debt, delete it,
 * delete one of its payments.
 *
 * All three surface a single translated `error` inline — there is no toast in
 * this app, and a destructive action that fails silently is the worst of both
 * worlds.
 */
export function useDebtStatusActions() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>, onDone: () => void, message: string) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setError(null);
      try {
        await action();
        // Always clear the flag: leaving it set to "wait for the unmount"
        // locks the button forever when the caller stays on the screen.
        setIsSubmitting(false);
        onDone();
      } catch (e) {
        console.error(message, e);
        setError(message);
        setIsSubmitting(false);
      }
    },
    [isSubmitting],
  );

  return {
    isSubmitting,
    error,
    clearError: useCallback(() => setError(null), []),

    closeDebt: useCallback(
      (id: number, status: "cancelled" | "written_off", onDone: () => void) =>
        run(
          () => debtService.closeDebt(id, status),
          onDone,
          t("debtDetail.confirm.failed"),
        ),
      [run, t],
    ),

    /**
     * The service refuses to delete a debt that has payments, and says so in
     * English. The menu already hides the option in that case, so this is the
     * race — a payment recorded on another screen between render and tap — and
     * it gets the translated explanation rather than the raw throw.
     */
    removeDebt: useCallback(
      (id: number, onDone: () => void) =>
        run(
          () => debtService.removeDebt(id),
          onDone,
          t("debtDetail.confirm.deleteBlocked"),
        ),
      [run, t],
    ),

    removePayment: useCallback(
      (id: number, onDone: () => void) =>
        run(
          () => debtService.removePayment(id),
          onDone,
          t("debtDetail.confirm.failed"),
        ),
      [run, t],
    ),
  };
}
