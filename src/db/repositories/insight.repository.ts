import { and, desc, eq, gte, isNull, lte, sql, type SQL } from "drizzle-orm";

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
 * - Only main funds count. A wallet the user marked as not a main fund —
 *   savings, investments — is money they do not mean to spend, so neither its
 *   income nor its spending belongs in "how is the month going".
 * - Debt cash flow is separated out. The debt module records a disbursement as
 *   income (`loan-received`) and a repayment as expense (`debt-repayment`), so
 *   counting them plainly would report a 50m loan as a good month and put the
 *   instalment at the top of the spending chart. They are tagged with
 *   `debt_id`, and reported on their own line instead.
 */

type Range = { from: Date; to: Date };

/** Mirrors `Granularity` in services/insight.ts; the db layer imports nothing above it. */
type Granularity = "day" | "week" | "month";

/**
 * The source wallet is a main fund. Written literally, with its own alias, so
 * it cannot be confused with the `wallets` joined in largestTransaction.
 */
const FROM_MAIN_FUND = sql`"transactions"."wallet_id" IN (
  SELECT "main_wallets"."id" FROM "wallets" AS "main_wallets"
  WHERE "main_wallets"."is_main_fund" = 1
)`;

/** Every insight query starts from here: inside the window, main funds only. */
const withinRange = ({ from, to }: Range) =>
  and(
    gte(transactions.occurredAt, from),
    lte(transactions.occurredAt, to),
    FROM_MAIN_FUND,
  );

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
 * The trend chart's buckets, keyed exactly as bucketSeries (services/insight.ts)
 * expects them.
 *
 * `occurred_at` is stored as unix seconds, and the bucket has to be the user's
 * day: without `localtime` a transaction recorded late on the 31st lands in the
 * next month. A week is keyed by its Monday — stepping back six days and then
 * forward to the next Monday lands on the Monday on or before the date.
 */
const BUCKETS: Record<Granularity, SQL<string>> = {
  day: sql<string>`strftime('%Y-%m-%d', "transactions"."occurred_at", 'unixepoch', 'localtime')`,
  week: sql<string>`date("transactions"."occurred_at", 'unixepoch', 'localtime', '-6 days', 'weekday 1')`,
  month: sql<string>`strftime('%Y-%m', "transactions"."occurred_at", 'unixepoch', 'localtime')`,
};

export type PeriodTotalsRow = {
  income: number;
  expense: number;
  debtIn: number;
  debtOut: number;
};

export type SeriesTotalsRow = PeriodTotalsRow & { bucket: string };

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

  /** The whole trend in one query rather than one query per bucket. */
  seriesTotals: (range: Range, granularity: Granularity) =>
    db
      .select({
        bucket: BUCKETS[granularity],
        income: INCOME,
        expense: EXPENSE,
        debtIn: DEBT_IN,
        debtOut: DEBT_OUT,
      })
      .from(transactions)
      .where(withinRange(range))
      .groupBy(BUCKETS[granularity]),

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
