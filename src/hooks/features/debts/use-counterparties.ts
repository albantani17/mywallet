import { counterpartyQueries, schema } from "@/db";
import type { CounterpartyKind, CounterpartyWithUsage } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";

/**
 * The parties already on file, for the "used before" chips.
 *
 * Picking one instead of retyping is what keeps a single Budi from becoming
 * three: the totals per party would otherwise split without the user ever
 * seeing why.
 */
export function useCounterparties(kind?: CounterpartyKind) {
  // The usage count each chip shows is summed from the debts table.
  const { data, updatedAt } = useLiveData(
    counterpartyQueries.list({ kind }),
    [schema.counterparties, schema.debts],
    [kind],
  );

  return {
    counterparties: (data ?? []) as CounterpartyWithUsage[],
    isReady: updatedAt !== undefined,
  };
}
