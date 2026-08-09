import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { paymentQueries } from "@/db";
import type { PaymentWithAllocations } from "@/db";

/**
 * A debt's payments, newest first.
 *
 * `unallocated` — money the payment could not place on any installment — comes
 * back with each row so the history can show it rather than letting it vanish.
 */
export function usePayments(debtId: number | null, refreshKey = 0) {
  const { data, error, updatedAt } = useLiveQuery(
    paymentQueries.listByDebt(debtId ?? -1),
    [debtId, refreshKey],
  );

  return {
    payments: (data ?? []) as PaymentWithAllocations[],
    isReady: updatedAt !== undefined,
    error,
  };
}
