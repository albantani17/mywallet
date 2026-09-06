import { useMemo } from "react";

import { FREQUENT_WINDOW_DAYS, schema, transactionQueries } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";

/** The join reads all three, so all three have to be watched. */
const FREQUENT_TABLES = [
  schema.transactions,
  schema.wallets,
  schema.categories,
];

/**
 * Transaction shapes recorded often enough to be worth repeating with one tap.
 *
 * Most personal spending is the same handful of things over and over, which is
 * why this exists at all: a chip that already knows the amount, the wallet and
 * the category beats any amount of typing.
 */
export function useFrequentTransactions(limit = 6) {
  // Anchored once per mount. A window recomputed every render would rewrite the
  // query text without touching the deps that decide when it actually re-runs,
  // so the sliding would be invisible anyway — better to be explicit about it.
  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - FREQUENT_WINDOW_DAYS);
    return date;
  }, []);

  const { data, error, updatedAt } = useLiveData(
    transactionQueries.frequent({ since, limit }),
    FREQUENT_TABLES,
    [limit],
  );

  return {
    suggestions: data ?? [],
    // Undefined until the first result lands — the strip must not flash an
    // empty state at someone who does have habits.
    isReady: updatedAt !== undefined,
    error,
  };
}
