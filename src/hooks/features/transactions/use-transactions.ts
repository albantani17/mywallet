import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import { transactionQueries } from "@/db";
import { useRefresh } from "@/hooks/use-refresh";

/** How many rows to add each time the list reaches its end. */
const PAGE_SIZE = 50;

/**
 * Live list of transactions, newest first, with a window that grows on demand.
 *
 * Paging raises `limit` instead of advancing `offset`. The live query then
 * watches one widening window, so a transaction inserted while the user is
 * scrolling still appears — and nothing is skipped or repeated, which is what
 * an offset would risk once the rows underneath shift.
 */
export function useTransactions() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { refreshKey, isRefreshing, refresh: bumpQuery, settle } = useRefresh();

  const { data, error, updatedAt } = useLiveQuery(
    transactionQueries.list({ limit }),
    [limit, refreshKey],
  );

  useEffect(settle, [settle, updatedAt, error]);

  // A pull also collapses the window back to one page. Re-running a list the
  // user had scrolled to 400 rows would re-read all of them for no reason, and
  // "refresh" reasonably means "back to the top, newest first".
  const refresh = useCallback(() => {
    setLimit(PAGE_SIZE);
    bumpQuery();
  }, [bumpQuery]);

  const transactions = data ?? [];
  // A full page means there is probably more behind it. Worst case the next
  // page comes back empty and this settles to false.
  const hasMore = transactions.length >= limit;

  const loadMore = useCallback(() => {
    setLimit((current) =>
      // Guard against onEndReached firing repeatedly before the next page has
      // landed, which would run the window far past the data.
      transactions.length >= current ? current + PAGE_SIZE : current,
    );
  }, [transactions.length]);

  return {
    transactions,
    hasMore,
    loadMore,
    isRefreshing,
    refresh,
    // Undefined until the first query resolves — callers use it to avoid
    // treating "not loaded yet" as "no transactions".
    isReady: updatedAt !== undefined,
    error,
  };
}
