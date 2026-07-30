import { useCallback, useState } from "react";

/**
 * Pull-to-refresh plumbing for a useLiveQuery-backed hook.
 *
 * The live query subscribes to one table only — the one it selects FROM — so
 * anything derived from another table goes stale silently. A wallet balance is
 * summed from `transactions`, but its query watches `wallets`, so recording a
 * transaction elsewhere in the app leaves the displayed balance behind until
 * something happens to touch the wallets table. Refreshing re-runs the query
 * outright.
 *
 * `refreshKey` goes into the query's dependency list; the caller calls
 * `settle()` when a result lands, which is what stops the spinner. Passing
 * `updatedAt` in as an argument instead would be circular — it does not exist
 * until after useLiveQuery has run.
 */
export function useRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((key) => key + 1);
  }, []);

  const settle = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  return { refreshKey, isRefreshing, refresh, settle };
}
