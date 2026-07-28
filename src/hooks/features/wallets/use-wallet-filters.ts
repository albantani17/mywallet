import { useState } from "react";

import type { WalletType } from "@/db";

import { useWallets } from "./use-wallets";

/** "all" is the default tab; anything else narrows to a single wallet type. */
export type WalletFilter = WalletType | "all";

/**
 * Search + category state for the wallets screen.
 *
 * Filtering happens in memory over the live list rather than in SQL: the list
 * is small, it is already subscribed via useWallets, and a second query path
 * would complicate the tabs gate that shares the same hook.
 */
export function useWalletFilters() {
  const { wallets, isReady, error } = useWallets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WalletFilter>("all");

  const needle = query.trim().toLowerCase();

  const filtered = wallets.filter((wallet) => {
    if (filter !== "all" && wallet.type !== filter) return false;
    if (needle === "") return true;
    return wallet.name.toLowerCase().includes(needle);
  });

  // Summed from the filtered list, so the headline total tracks whatever the
  // tabs and the search box are showing. walletRepository.getTotalAssets()
  // cannot express that — it always sums every active wallet.
  const total = filtered.reduce((sum, wallet) => sum + Number(wallet.balance), 0);

  return {
    wallets: filtered,
    total,
    query,
    filter,
    setQuery,
    setFilter,
    isReady,
    error,
    // Unfiltered count, so the screen can tell "no wallets yet" apart from
    // "nothing matched this search".
    hasWallets: wallets.length > 0,
  };
}
