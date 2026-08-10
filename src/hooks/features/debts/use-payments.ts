import { paymentQueries, schema } from "@/db";
import type { PaymentWithAllocations } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";

/**
 * A debt's payments, newest first.
 *
 * `unallocated` — money the payment could not place on any installment — comes
 * back with each row so the history can show it rather than letting it vanish.
 */
export function usePayments(debtId: number | null, refreshKey = 0) {
  const { data, error, updatedAt } = useLiveData(
    paymentQueries.listByDebt(debtId ?? -1),
    [schema.payments, schema.paymentAllocations, schema.wallets],
    [debtId, refreshKey],
  );

  return {
    payments: (data ?? []) as PaymentWithAllocations[],
    isReady: updatedAt !== undefined,
    error,
  };
}
