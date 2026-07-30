import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { debtQueries } from "@/db";
import type { DebtDirection } from "@/db";

/** Live list of ongoing debts in one direction, with what is still owed. */
export function useDebts(direction: DebtDirection) {
  const { data, error, updatedAt } = useLiveQuery(
    debtQueries.listWithOutstanding({ direction }),
    [direction],
  );

  return {
    debts: data ?? [],
    // Undefined until the first query resolves — callers use it to avoid
    // showing the empty state before anything has loaded.
    isReady: updatedAt !== undefined,
    error,
  };
}
