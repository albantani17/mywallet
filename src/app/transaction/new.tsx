import { useLocalSearchParams } from "expo-router";

import { NewTransactionScreen } from "@/components/features/transactions/new-transaction-screen";
import { TRANSACTION_TYPES, type TransactionType } from "@/db";
import type { TransactionDraft } from "@/hooks/features/transactions/use-create-transaction";

/** Search params arrive as a string or an array of them; only the first counts. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInteger(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (raw === undefined || raw === "") return undefined;

  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function toType(value: string | string[] | undefined): TransactionType | undefined {
  const raw = first(value);
  return TRANSACTION_TYPES.find((type) => type === raw);
}

/**
 * The form, optionally seeded from the URL.
 *
 * Long-pressing a repeat chip lands here with the habit's shape already in the
 * params, so "same thing, different amount" reuses the real form instead of
 * needing an editor of its own. Anything unparseable is simply dropped — a bad
 * link should open an empty form, never a wrong one.
 */
export default function NewTransactionRoute() {
  const params = useLocalSearchParams();

  const initial: Partial<TransactionDraft> = {
    type: toType(params.type),
    amount: toInteger(params.amount),
    walletId: toInteger(params.walletId),
    categoryId: toInteger(params.categoryId),
    note: first(params.note),
  };

  return <NewTransactionScreen initial={initial} />;
}
