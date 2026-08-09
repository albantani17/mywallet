import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { counterpartyQueries } from "@/db";
import type { CounterpartyKind, CounterpartyWithUsage } from "@/db";

/**
 * The parties already on file, for the "used before" chips.
 *
 * Picking one instead of retyping is what keeps a single Budi from becoming
 * three: the totals per party would otherwise split without the user ever
 * seeing why.
 */
export function useCounterparties(kind?: CounterpartyKind) {
  const { data, updatedAt } = useLiveQuery(counterpartyQueries.list({ kind }), [
    kind,
  ]);

  return {
    counterparties: (data ?? []) as CounterpartyWithUsage[],
    isReady: updatedAt !== undefined,
  };
}
