import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect } from "react";

import { debtQueries } from "@/db";
import type { DebtDirection } from "@/db";
import { useRefresh } from "@/hooks/use-refresh";

/**
 * Live list of debts in one direction — open and settled both, so a debt does
 * not vanish the moment it is paid off. Each row carries what has been repaid
 * and what is left.
 */
export function useDebts(direction: DebtDirection) {
  const { refreshKey, isRefreshing, refresh, settle } = useRefresh();

  const { data, error, updatedAt } = useLiveQuery(
    debtQueries.listWithOutstanding({ direction }),
    [direction, refreshKey],
  );

  useEffect(settle, [settle, updatedAt, error]);

  return {
    debts: data ?? [],
    // Undefined until the first query resolves — callers use it to avoid
    // showing the empty state before anything has loaded.
    isReady: updatedAt !== undefined,
    error,
    isRefreshing,
    refresh,
  };
}

/**
 * One debt with its live outstanding balance.
 *
 * Filtered from the same list query rather than fetched by id: the payment
 * screen needs the derived `outstanding`, and reusing the query means the
 * screen updates the moment a payment lands.
 */
export function useDebt(id: number | null) {
  const { data, updatedAt } = useLiveQuery(
    debtQueries.listWithOutstanding(),
    [],
  );

  return {
    debt: id === null ? null : (data?.find((row) => row.id === id) ?? null),
    isReady: updatedAt !== undefined,
  };
}
