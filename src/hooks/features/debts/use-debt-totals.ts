import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import { debtQueries } from "@/db";
import type { DebtDirection } from "@/db";

export type DebtTotals = {
  outstanding: number;
  debtCount: number;
  overdueCount: number;
};

const EMPTY: DebtTotals = { outstanding: 0, debtCount: 0, overdueCount: 0 };

/**
 * What is still owed in each direction, across every open debt.
 *
 * The query returns a row per direction and only for directions that have at
 * least one active debt, so both sides are zero-filled here — a header that
 * renders nothing until the first debt exists reads as a broken screen.
 */
export function useDebtTotals() {
  // One clock for the whole header, so the overdue counts of the two
  // directions cannot be measured a render apart.
  const now = useMemo(() => new Date(), []);
  const { data, error, updatedAt } = useLiveQuery(
    debtQueries.totalsByDirection(now),
    [now],
  );

  const rows = data ?? [];
  const forDirection = (direction: DebtDirection): DebtTotals => {
    const row = rows.find((item) => item.direction === direction);
    return row
      ? {
          outstanding: row.outstanding ?? 0,
          debtCount: row.debtCount ?? 0,
          overdueCount: row.overdueCount ?? 0,
        }
      : EMPTY;
  };

  return {
    payable: forDirection("payable"),
    receivable: forDirection("receivable"),
    isReady: updatedAt !== undefined,
    error,
  };
}
