import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WalletWithBalance } from "@/db";
import {
  isWalletUsed,
  walletService,
  type RemoveWalletResult,
} from "@/services/wallet-service";

/** Unused wallets confirm once; used ones add a type-the-name step. */
export type DeleteStep = "confirm" | "typeName";

export function useDeleteWallet(
  wallet: WalletWithBalance,
  onRemoved: (result: RemoveWalletResult) => void,
) {
  const { t } = useTranslation();
  const [step, setStep] = useState<DeleteStep>("confirm");
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasUsage = isWalletUsed(wallet);
  const usageCount =
    Number(wallet.transactionCount) + Number(wallet.debtCount);

  // Exact match on the trimmed name — the whole point of this step is that it
  // cannot be dismissed by reflex.
  const isNameConfirmed = typedName.trim() === wallet.name.trim();

  const remove = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await walletService.removeWallet(wallet);
      setIsSubmitting(false);
      onRemoved(result);
    } catch (e) {
      console.error("Failed to remove the wallet", e);
      setError(t("wallets.delete.failed"));
      setIsSubmitting(false);
    }
  }, [isSubmitting, onRemoved, t, wallet]);

  /** Advances to the name step for a used wallet, or removes straight away. */
  const confirm = useCallback(async () => {
    if (hasUsage && step === "confirm") {
      setStep("typeName");
      return;
    }
    if (hasUsage && !isNameConfirmed) return;

    await remove();
  }, [hasUsage, isNameConfirmed, remove, step]);

  return {
    step,
    typedName,
    setTypedName,
    error,
    isSubmitting,
    hasUsage,
    usageCount,
    isNameConfirmed,
    confirm,
  };
}
