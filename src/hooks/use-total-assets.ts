import { sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db";
import { transactionsTable, walletsTable } from "@/db/schema";

/**
 * Total aset (net worth) yang terhitung otomatis dan reaktif terhadap perubahan DB.
 *
 * Dijumlah lintas SEMUA dompet, sehingga transfer antar-dompet sendiri saling
 * meniadakan (uang berpindah, total tetap). Rumus:
 *   total = Σ initialBalance + Σ income − Σ expense − Σ fee
 */
export function useTotalAssets(): { total: number; isReady: boolean } {
  const wallets = useLiveQuery(
    db
      .select({
        initial: sql<number>`COALESCE(SUM(${walletsTable.initialBalance}), 0)`,
      })
      .from(walletsTable),
  );

  const tx = useLiveQuery(
    db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        fee: sql<number>`COALESCE(SUM(${transactionsTable.fee}), 0)`,
      })
      .from(transactionsTable),
  );

  const initial = Number(wallets.data?.[0]?.initial ?? 0);
  const income = Number(tx.data?.[0]?.income ?? 0);
  const expense = Number(tx.data?.[0]?.expense ?? 0);
  const fee = Number(tx.data?.[0]?.fee ?? 0);

  return {
    total: initial + income - expense - fee,
    isReady: wallets.updatedAt !== undefined && tx.updatedAt !== undefined,
  };
}
