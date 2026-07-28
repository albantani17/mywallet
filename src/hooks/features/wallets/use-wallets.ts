import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { walletQueries } from "@/db";

/**
 * Live list of active wallets with their derived balances. Shared by the tabs
 * gate (which blocks until a wallet exists) and the wallets screen.
 */
export function useWallets({ includeArchived = false } = {}) {
  const { data, error, updatedAt } = useLiveQuery(
    walletQueries.listWithBalances({ includeArchived }),
    [includeArchived],
  );

  return {
    wallets: data ?? [],
    // Undefined until the first query resolves — callers use it to avoid
    // treating "not loaded yet" as "no wallets".
    isReady: updatedAt !== undefined,
    error,
  };
}
