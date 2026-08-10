import { useCallback, useEffect } from "react";

import { walletQueries } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";

import { useWallets, WALLET_TABLES } from "../wallets/use-wallets";

export const CAROUSEL_LIMIT = 3;

/**
 * Dashboard data: the richest few wallets for the carousel, plus whether the
 * user has more than the carousel shows (which is what reveals "see all").
 *
 * `refreshOthers` lets a sibling section (the insights) join the same pull —
 * one gesture, one spinner, everything on the screen re-read.
 */
export function useDashboardSummary(refreshOthers?: () => void) {
  const {
    wallets,
    isReady: isListReady,
    error,
    isRefreshing,
    refresh: refreshWallets,
  } = useWallets();

  const { refreshKey, refresh: refreshCarousel, settle } = useRefresh();

  const { data: topWallets, updatedAt } = useLiveData(
    walletQueries.topByBalance(CAROUSEL_LIMIT),
    WALLET_TABLES,
    [refreshKey],
  );

  useEffect(settle, [settle, updatedAt]);

  // Several queries back this screen, so a pull has to re-run all of them. The
  // spinner follows the wallet list; they are local reads that land together.
  const refresh = useCallback(() => {
    refreshWallets();
    refreshCarousel();
    refreshOthers?.();
  }, [refreshCarousel, refreshOthers, refreshWallets]);

  return {
    topWallets: topWallets ?? [],
    hasMore: wallets.length > CAROUSEL_LIMIT,
    isReady: isListReady && updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
  };
}
