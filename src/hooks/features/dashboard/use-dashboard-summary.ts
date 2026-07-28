import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { walletQueries } from "@/db";

import { useWallets } from "../wallets/use-wallets";

export const CAROUSEL_LIMIT = 3;

/**
 * Dashboard data: the richest few wallets for the carousel, plus whether the
 * user has more than the carousel shows (which is what reveals "see all").
 */
export function useDashboardSummary() {
  const { wallets, isReady: isListReady, error } = useWallets();

  const { data: topWallets, updatedAt } = useLiveQuery(
    walletQueries.topByBalance(CAROUSEL_LIMIT),
  );

  return {
    topWallets: topWallets ?? [],
    hasMore: wallets.length > CAROUSEL_LIMIT,
    isReady: isListReady && updatedAt !== undefined,
    error,
  };
}
