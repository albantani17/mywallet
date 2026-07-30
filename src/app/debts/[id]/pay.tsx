import { useLocalSearchParams } from "expo-router";

import { PayReceivableScreen } from "@/components/features/debts/pay-receivable-screen";

export default function PayReceivableRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  return (
    <PayReceivableScreen debtId={Number.isFinite(debtId) ? debtId : null} />
  );
}
