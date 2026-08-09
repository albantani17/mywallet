import { useLocalSearchParams } from "expo-router";

import { NewDebtScreen } from "@/components/features/debts/new-debt-screen";
import { DEBT_DIRECTIONS, type DebtDirection } from "@/db";

export default function NewDebtRoute() {
  const { direction } = useLocalSearchParams<{ direction?: string }>();

  // The tab the user came from decides the starting side of the ledger; an
  // unknown value (a hand-typed deep link) falls back to a debt they owe.
  const initialDirection = DEBT_DIRECTIONS.includes(direction as DebtDirection)
    ? (direction as DebtDirection)
    : "payable";

  return <NewDebtScreen initialDirection={initialDirection} />;
}
