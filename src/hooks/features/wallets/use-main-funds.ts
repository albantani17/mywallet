import { useCallback, useState } from "react";

import { walletService } from "@/services/wallet-service";

import { useWallets } from "./use-wallets";

/**
 * Which wallets count as everyday money. Toggling writes straight away — the
 * list is live, so the checkbox, the summary row and every insight follow the
 * write without a save button.
 */
export function useMainFunds() {
  const { wallets, isReady } = useWallets();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const mainFunds = wallets.filter((wallet) => wallet.isMainFund);
  const mainTotal = mainFunds.reduce(
    (sum, wallet) => sum + Number(wallet.balance),
    0,
  );

  const toggle = useCallback(
    async (walletId: number, isMainFund: boolean) => {
      // One write at a time: a second tap before the first lands would race it.
      if (pendingId !== null) return;

      setPendingId(walletId);
      setHasError(false);
      try {
        await walletService.setMainFund(walletId, isMainFund);
      } catch (e) {
        console.error("Failed to update the main-fund flag", e);
        setHasError(true);
      } finally {
        setPendingId(null);
      }
    },
    [pendingId],
  );

  return {
    wallets,
    mainCount: mainFunds.length,
    mainTotal,
    isReady,
    pendingId,
    hasError,
    toggle,
  };
}
