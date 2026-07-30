import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useEffect } from "react";

import { walletQueries } from "@/db";
import { useRefresh } from "@/hooks/use-refresh";

import { useWallets } from "../wallets/use-wallets";

export const CAROUSEL_LIMIT = 3;

/**
 * Dashboard data: the richest few wallets for the carousel, plus whether the
 * user has more than the carousel shows (which is what reveals "see all").
 */
export function useDashboardSummary() {
  const {
    wallets,
    isReady: isListReady,
    error,
    isRefreshing,
    refresh: refreshWallets,
  } = useWallets();

  const { refreshKey, refresh: refreshCarousel, settle } = useRefresh();

  const { data: topWallets, updatedAt } = useLiveQuery(
    walletQueries.topByBalance(CAROUSEL_LIMIT),
    [refreshKey],
  );

  useEffect(settle, [settle, updatedAt]);

  // Two queries back this screen, so a pull has to re-run both. The spinner
  // follows the wallet list; both are local reads that land together.
  const refresh = useCallback(() => {
    refreshWallets();
    refreshCarousel();
  }, [refreshCarousel, refreshWallets]);

  return {
    topWallets: topWallets ?? [],
    hasMore: wallets.length > CAROUSEL_LIMIT,
    isReady: isListReady && updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
  };
}
