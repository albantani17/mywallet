import { useLocalSearchParams } from "expo-router";

import { DebtDetailScreen } from "@/components/features/debts/debt-detail-screen";

export default function DebtDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  // A hand-typed or stale link gives null, and the screen says "no longer
  // exists" instead of querying for NaN.
  return (
    <DebtDetailScreen debtId={Number.isFinite(debtId) ? debtId : null} />
  );
}
