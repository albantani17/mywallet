import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";

import { db } from "../client";
import { categories } from "../schema/categories";
import { transactions } from "../schema/transactions";
import { wallets } from "../schema/wallets";

/**
 * Aggregates behind the home screen's insights.
 *
 * Every entry here is a select *builder*, not a promise: `useLiveData` needs
 * the builder so it can re-run the query when the tables behind it change.
 *
 * Two rules run through all of them:
 *
 * - Transfers never count. Moving money between your own wallets is not income
 *   and not spending — the same rule the wallet balances use.
 * - Debt cash flow is separated out. The debt module records a disbursement as
 *   income (`loan-received`) and a repayment as expense (`debt-repayment`), so
 *   counting them plainly would report a 50m loan as a good month and put the
 *   instalment at the top of the spending chart. They are tagged with
 *   `debt_id`, and reported on their own line instead.
 */

type Range = { from: Date; to: Date };

const withinRange = ({ from, to }: Range) =>
  and(gte(transactions.occurredAt, from), lte(transactions.occurredAt, to));

// Identifiers are written out literally rather than interpolated. Drizzle
// strips table qualifiers from interpolated columns inside a SELECT list, which
// is how a correlated condition silently stops correlating — see the long note
// in wallet.repository.ts.
const INCOME = sql<number>`COALESCE(SUM(CASE WHEN "transactions"."type" = 'income'
  AND "transactions"."debt_id" IS NULL THEN "transactions"."amount" ELSE 0 END), 0)`;

// A bill is an expense that happens to carry a due date, so it belongs on the
// same side — the same call getMonthlySummary used to make.
const EXPENSE = sql<number>`COALESCE(SUM(CASE WHEN "transactions"."type" IN ('expense', 'bill')
  AND "transactions"."debt_id" IS NULL THEN "transactions"."amount" ELSE 0 END), 0)`;

const DEBT_IN = sql<number>`COALESCE(SUM(CASE WHEN "transactions"."type" = 'income'
  AND "transactions"."debt_id" IS NOT NULL THEN "transactions"."amount" ELSE 0 END), 0)`;

const DEBT_OUT = sql<number>`COALESCE(SUM(CASE WHEN "transactions"."type" IN ('expense', 'bill')
  AND "transactions"."debt_id" IS NOT NULL THEN "transactions"."amount" ELSE 0 END), 0)`;

/**
 * `occurred_at` is stored as unix seconds, and the bucket has to be the user's
 * month: without `localtime` a transaction recorded late on the 31st lands in
 * the next month.
 */
const MONTH_BUCKET = sql<string>`strftime('%Y-%m', "transactions"."occurred_at", 'unixepoch', 'localtime')`;

export type PeriodTotalsRow = {
  income: number;
  expense: number;
  debtIn: number;
  debtOut: number;
};

export type MonthlyTotalsRow = PeriodTotalsRow & { month: string };

export type CategorySpendRow = {
  categoryId: number | null;
  name: string | null;
  slug: string | null;
  icon: string | null;
  color: string | null;
  total: number;
};

export type LargestTransactionRow = {
  id: number;
  amount: number;
  note: string | null;
  occurredAt: Date;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  walletName: string | null;
};

export const insightQueries = {
  /** One row of totals for a window. Used for this month and both baselines. */
  periodTotals: (range: Range) =>
    db
      .select({
        income: INCOME,
        expense: EXPENSE,
        debtIn: DEBT_IN,
        debtOut: DEBT_OUT,
      })
      .from(transactions)
      .where(withinRange(range)),

  /** Spending per category, biggest first. Debt cash flow stays out of it. */
  spendingByCategory: (range: Range) =>
    db
      .select({
        categoryId: transactions.categoryId,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
        total: sql<number>`COALESCE(SUM("transactions"."amount"), 0)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          withinRange(range),
          isNull(transactions.debtId),
          sql`"transactions"."type" IN ('expense', 'bill')`,
        ),
      )
      .groupBy(transactions.categoryId)
      .orderBy(desc(sql`COALESCE(SUM("transactions"."amount"), 0)`)),

  /** The whole trend in one query rather than one query per month. */
  monthlyTotals: (range: Range) =>
    db
      .select({
        month: MONTH_BUCKET,
        income: INCOME,
        expense: EXPENSE,
        debtIn: DEBT_IN,
        debtOut: DEBT_OUT,
      })
      .from(transactions)
      .where(withinRange(range))
      .groupBy(MONTH_BUCKET),

  /** The single biggest spend of the window, for the "largest" line. */
  largestTransaction: (range: Range) =>
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        note: transactions.note,
        occurredAt: transactions.occurredAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        walletName: wallets.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .where(
        and(
          withinRange(range),
          isNull(transactions.debtId),
          sql`"transactions"."type" IN ('expense', 'bill')`,
        ),
      )
      .orderBy(desc(transactions.amount))
      .limit(1),
};
