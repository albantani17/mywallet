import { useMemo } from "react";

import { schema, transactionQueries } from "@/db";
import type { TransactionFilterValues } from "@/hooks/features/transactions/use-transaction-filters";
import { useLiveData } from "@/hooks/use-live-data";

import { NO_FILTERS } from "./use-transactions";

/** The search filter matches wallet names, so wallets are watched too. */
const DAILY_TOTAL_TABLES = [schema.transactions, schema.wallets];

export type DayTotals = { income: number; expense: number };

/**
 * Money in and out per day for the transaction list's headers, keyed by
 * `toDayKey`. Runs under the same filters as the list, so a header always sums
 * exactly the rows it would show once everything is scrolled in.
 */
export function useDailyTotals(filters: TransactionFilterValues = NO_FILTERS) {
  const search = filters.search.trim();
  const fromTime = filters.from?.getTime() ?? null;
  const toTime = filters.to?.getTime() ?? null;

  const { data } = useLiveData(
    transactionQueries.dailyTotals({
      search,
      walletId: filters.walletId ?? undefined,
      categoryId: filters.categoryId ?? undefined,
      from: filters.from ?? undefined,
      to: filters.to ?? undefined,
    }),
    DAILY_TOTAL_TABLES,
    [search, filters.walletId, filters.categoryId, fromTime, toTime],
  );

  return useMemo(
    () =>
      new Map<string, DayTotals>(
        (data ?? []).map((row) => [
          row.day,
          { income: Number(row.income), expense: Number(row.expense) },
        ]),
      ),
    [data],
  );
}
