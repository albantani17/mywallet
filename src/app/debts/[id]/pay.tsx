import { useLocalSearchParams } from "expo-router";

import { RecordPaymentScreen } from "@/components/features/debts/record-payment-screen";

export default function RecordPaymentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  return (
    <RecordPaymentScreen debtId={Number.isFinite(debtId) ? debtId : null} />
  );
}
