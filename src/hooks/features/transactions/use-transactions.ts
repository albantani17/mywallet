import { useCallback, useEffect, useState } from "react";

import { schema, transactionQueries } from "@/db";
import type { TransactionFilterValues } from "@/hooks/features/transactions/use-transaction-filters";
import { useLiveData } from "@/hooks/use-live-data";
import { useRefresh } from "@/hooks/use-refresh";

/** The wallet and category names each row shows are joined in. */
const TRANSACTION_TABLES = [
  schema.transactions,
  schema.wallets,
  schema.categories,
];

/** How many rows to add each time the list reaches its end. */
const PAGE_SIZE = 50;

const NO_FILTERS: TransactionFilterValues = {
  search: "",
  walletId: null,
  categoryId: null,
  from: null,
  to: null,
};

/**
 * Live list of transactions, newest first, with a window that grows on demand.
 *
 * Paging raises `limit` instead of advancing `offset`. The live query then
 * watches one widening window, so a transaction inserted while the user is
 * scrolling still appears — and nothing is skipped or repeated, which is what
 * an offset would risk once the rows underneath shift.
 *
 * Filtering happens in SQL rather than over the loaded rows: the window only
 * holds the newest few pages, so an in-memory filter would silently ignore
 * every older transaction that matched.
 */
export function useTransactions(filters: TransactionFilterValues = NO_FILTERS) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { refreshKey, isRefreshing, refresh: bumpQuery, settle } = useRefresh();

  const search = filters.search.trim();
  // Dates are compared as timestamps below. A Date is a fresh object on every
  // render, so putting one in the dependency array would re-run the query
  // forever; a number settles.
  const fromTime = filters.from?.getTime() ?? null;
  const toTime = filters.to?.getTime() ?? null;

  /**
   * Narrowing the list starts it over.
   *
   * Without this, changing a filter while scrolled deep would re-read hundreds
   * of rows to show a handful, and leave the user at the bottom of a list that
   * just got shorter. It adjusts state during render rather than in an effect:
   * React discards this render and redoes it with the new limit, so the query
   * below never runs with the stale one — an effect would let a 400-row read
   * fire first and only then correct itself.
   */
  const filterKey = `${search}|${filters.walletId}|${filters.categoryId}|${fromTime}|${toTime}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setLimit(PAGE_SIZE);
  }

  const { data, error, updatedAt } = useLiveData(
    transactionQueries.list({
      limit,
      search,
      walletId: filters.walletId ?? undefined,
      categoryId: filters.categoryId ?? undefined,
      from: filters.from ?? undefined,
      to: filters.to ?? undefined,
    }),
    TRANSACTION_TABLES,
    [
      limit,
      refreshKey,
      search,
      filters.walletId,
      filters.categoryId,
      fromTime,
      toTime,
    ],
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
