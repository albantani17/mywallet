import { useEffect } from "react";

import { schema, walletQueries } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";

/** Balances are summed from transactions, and the debt count from debts. */
export const WALLET_TABLES = [schema.wallets, schema.transactions, schema.debts];

/**
 * Live list of active wallets with their derived balances. Shared by the tabs
 * gate (which blocks until a wallet exists) and the wallets screen.
 */
export function useWallets({ includeArchived = false } = {}) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();

  const { data, error, updatedAt } = useLiveData(
    walletQueries.listWithBalances({ includeArchived }),
    WALLET_TABLES,
    [includeArchived, refreshKey],
  );

  // A result landing — fresh rows or an error — is what ends a pull-to-refresh.
  useEffect(settle, [settle, updatedAt, error]);

  return {
    wallets: data ?? [],
    // Undefined until the first query resolves — callers use it to avoid
    // treating "not loaded yet" as "no wallets".
    isReady: updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
  };
}
