import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import {
  getTableConfig,
  type AnySQLiteSelect,
  type SQLiteTable,
} from "drizzle-orm/sqlite-core";
import type { SQLiteRelationalQuery } from "drizzle-orm/sqlite-core/query-builders/query";
import { useEffect, useMemo, useState } from "react";

import { subscribeToTables } from "@/db";

/**
 * A live query that watches every table it reads, not just the one it selects
 * FROM.
 *
 * drizzle's `useLiveQuery` matches a single table name, which leaves every
 * derived figure in this app stale — balances summed from `transactions` under
 * a query on `wallets`, paid amounts summed from `payment_allocations` under a
 * query on `debts`. Passing the real dependencies here is what makes a screen
 * move on its own after a write somewhere else.
 *
 * It wraps `useLiveQuery` rather than replacing it: bumping a version into the
 * dependency array re-runs the query through drizzle's own machinery, so the
 * returned shape (`data`, `error`, `updatedAt`) is unchanged.
 */
export function useLiveData<
  T extends
    | Pick<AnySQLiteSelect, "_" | "then">
    | SQLiteRelationalQuery<"sync", unknown>,
>(
  query: T,
  tables: readonly SQLiteTable[],
  deps: unknown[] = [],
) {
  const [version, setVersion] = useState(0);

  // Table objects are stable module-level values, but the array literal at the
  // call site is new on every render — key the subscription by the names.
  const names = tables.map((table) => getTableConfig(table).name);
  const key = names.join(",");
  const watched = useMemo(() => key.split(","), [key]);

  useEffect(
    () => subscribeToTables(watched, () => setVersion((current) => current + 1)),
    [watched],
  );

  return useLiveQuery(query, [...deps, version]);
}
