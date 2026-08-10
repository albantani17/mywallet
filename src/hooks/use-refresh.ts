import { useCallback, useState } from "react";

/**
 * Pull-to-refresh plumbing for a live-query-backed hook.
 *
 * Keeping data current is `useLiveData`'s job — it watches every table a query
 * reads, so a payment recorded elsewhere reaches the screen on its own. This
 * hook is the manual gesture on top: it forces a re-read and, more to the
 * point, gives the user a spinner that says the app looked again.
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
