import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { db, type Executor } from "../client";
import { counterparties } from "../schema/counterparties";
import type { DebtDirection, DebtStatus } from "../schema/debts";
import { debts } from "../schema/debts";
import type {
  Debt,
  DebtInsert,
  DebtUpdate,
  DebtWithSummary,
} from "../validators/debt.validator";

/**
 * The full obligation: every installment this debt has, penalties included.
 *
 * `debts.principal` is deliberately not used — it is what the debt started as,
 * while the installments are what is actually billed once interest, fees and
 * any restructure are in.
 *
 * Identifiers are written out literally for the reason documented at length in
 * installment.repository.ts: drizzle strips table qualifiers from interpolated
 * columns inside a SELECT list, which silently decorrelates the subquery.
 */
const debtBilledExpression = sql<number>`
  COALESCE((
    SELECT SUM("installments"."total_amount")
    FROM "installments"
    WHERE "installments"."debt_id" = "debts"."id"
  ), 0)
`;

/** Everything ever allocated to any of this debt's installments. */
const debtPaidExpression = sql<number>`
  COALESCE((
    SELECT SUM("payment_allocations"."amount")
    FROM "payment_allocations"
    JOIN "installments"
      ON "installments"."id" = "payment_allocations"."installment_id"
    WHERE "installments"."debt_id" = "debts"."id"
  ), 0)
`;

/** What is left to pay; never negative, since rounding up is allowed. */
const debtOutstandingExpression = sql<number>`
  MAX(${debtBilledExpression} - ${debtPaidExpression}, 0)
`;

/** Earliest still-owed due date — what the row shows and sorts on. */
const debtNextDueExpression = sql`(
  SELECT MIN("installments"."due_date")
  FROM "installments"
  WHERE "installments"."debt_id" = "debts"."id"
    AND "installments"."due_date" IS NOT NULL
    AND "installments"."total_amount" > COALESCE((
      SELECT SUM("payment_allocations"."amount")
      FROM "payment_allocations"
      WHERE "payment_allocations"."installment_id" = "installments"."id"
    ), 0)
)`;

/**
 * Installments past their due date plus whatever grace the schedule allows.
 *
 * `due_date` is stored in SECONDS — that is what drizzle's `mode: "timestamp"`
 * writes — so a day of grace is 86400, not 86400000.
 */
const debtOverdueCountExpression = (nowSeconds: number) => sql<number>`(
  SELECT COUNT(*)
  FROM "installments"
  WHERE "installments"."debt_id" = "debts"."id"
    AND "installments"."due_date" IS NOT NULL
    AND "installments"."due_date" + (COALESCE((
          SELECT "debt_schedules"."grace_days"
          FROM "debt_schedules"
          WHERE "debt_schedules"."debt_id" = "debts"."id"
        ), 0) * 86400) < ${nowSeconds}
    AND "installments"."total_amount" > COALESCE((
      SELECT SUM("payment_allocations"."amount")
      FROM "payment_allocations"
      WHERE "payment_allocations"."installment_id" = "installments"."id"
    ), 0)
)`;

const debtWithSummaryColumns = (nowSeconds: number) => ({
  id: debts.id,
  counterpartyId: debts.counterpartyId,
  walletId: debts.walletId,
  direction: debts.direction,
  title: debts.title,
  principal: debts.principal,
  interestRateBps: debts.interestRateBps,
  interestMethod: debts.interestMethod,
  originDate: debts.originDate,
  currency: debts.currency,
  status: debts.status,
  closedAt: debts.closedAt,
  note: debts.note,
  createdAt: debts.createdAt,
  updatedAt: debts.updatedAt,

  counterpartyName: counterparties.name,
  counterpartyKind: counterparties.kind,

  // mapWith(Number) because SQLite can return a SUM as a string, and
  // useLiveQuery hands rows to components untouched.
  billed: debtBilledExpression.mapWith(Number),
  paid: debtPaidExpression.mapWith(Number),
  outstanding: debtOutstandingExpression.mapWith(Number),
  // mapWith(column) runs drizzle's own seconds-to-Date mapper, so this comes
  // back as a Date like any real timestamp column would.
  nextDueDate: debtNextDueExpression.mapWith(debts.originDate),
  overdueCount: debtOverdueCountExpression(nowSeconds).mapWith(Number),
});

const toSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

/** What the dashboard shows per direction, summed across every open debt. */
export type DebtDirectionTotals = {
  direction: DebtDirection;
  outstanding: number;
  debtCount: number;
  overdueCount: number;
};

export type DebtListOptions = {
  direction?: DebtDirection;
  status?: DebtStatus;
  counterpartyId?: number;
  /** Reference point for the overdue count; defaults to now. */
  now?: Date;
};

/**
 * Select builders, not promises — useLiveQuery needs the builder itself to
 * subscribe to table changes. The async methods below delegate here so the SQL
 * has one definition.
 */
export const debtQueries = {
  /**
   * Debts annotated with what they still owe and when the next payment falls.
   *
   * Open debts sort above closed ones, then by the nearest due date. Ordering
   * on the due date alone would float every dateless debt to the top, since
   * NULL sorts first in SQLite — hence the explicit NULLs-last CASE.
   */
  listWithSummary: ({
    direction,
    status,
    counterpartyId,
    now = new Date(),
  }: DebtListOptions = {}) => {
    const filters: SQL[] = [];
    if (direction) filters.push(eq(debts.direction, direction));
    if (status) filters.push(eq(debts.status, status));
    if (counterpartyId) filters.push(eq(debts.counterpartyId, counterpartyId));

    return db
      .select(debtWithSummaryColumns(toSeconds(now)))
      .from(debts)
      .leftJoin(counterparties, eq(counterparties.id, debts.counterpartyId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(
        sql`CASE WHEN "debts"."status" != 'active' THEN 1 ELSE 0 END`,
        sql`CASE WHEN ${debtNextDueExpression} IS NULL THEN 1 ELSE 0 END`,
        sql`${debtNextDueExpression} ASC`,
        desc(debts.id),
      );
  },

  getWithSummary: (id: number, now: Date = new Date()) =>
    db
      .select(debtWithSummaryColumns(toSeconds(now)))
      .from(debts)
      .leftJoin(counterparties, eq(counterparties.id, debts.counterpartyId))
      .where(eq(debts.id, id))
      .limit(1),

  /** One row per direction: what is still owed across every open debt. */
  totalsByDirection: (now: Date = new Date()) =>
    db
      .select({
        direction: debts.direction,
        outstanding: sql<number>`SUM(${debtOutstandingExpression})`.mapWith(Number),
        debtCount: sql<number>`COUNT(*)`.mapWith(Number),
        overdueCount:
          sql<number>`SUM(${debtOverdueCountExpression(toSeconds(now))})`.mapWith(
            Number,
          ),
      })
      .from(debts)
      .where(eq(debts.status, "active"))
      .groupBy(debts.direction),
};

export const debtRepository = {
  async listWithSummary(
    options: DebtListOptions = {},
  ): Promise<DebtWithSummary[]> {
    return debtQueries.listWithSummary(options) as Promise<DebtWithSummary[]>;
  },

  async getWithSummary(
    id: number,
    now: Date = new Date(),
  ): Promise<DebtWithSummary | null> {
    const rows = (await debtQueries.getWithSummary(
      id,
      now,
    )) as DebtWithSummary[];
    return rows[0] ?? null;
  },

  async getById(id: number): Promise<Debt | null> {
    const rows = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    return rows[0] ?? null;
  },

  /** One row per direction — the two dashboard headline figures. */
  async totalsByDirection(now: Date = new Date()): Promise<DebtDirectionTotals[]> {
    return debtQueries.totalsByDirection(now);
  },

  async create(data: DebtInsert): Promise<Debt> {
    const [row] = await db.insert(debts).values(data).returning();
    return row;
  },

  async update(id: number, data: DebtUpdate): Promise<Debt | null> {
    const [row] = await db
      .update(debts)
      .set(data)
      .where(eq(debts.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Removes the debt and, by cascade, its schedule, installments, payments and
   * allocations. The "not while payments exist" rule lives in debtService — it
   * is a decision to explain to the user, not a foreign-key error to surface.
   */
  async remove(id: number): Promise<void> {
    await db.delete(debts).where(eq(debts.id, id));
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    insert: (data: DebtInsert, exec: Executor = db): Debt => {
      const [row] = exec.insert(debts).values(data).returning().all();
      return row;
    },

    update: (id: number, data: DebtUpdate, exec: Executor = db): void => {
      exec.update(debts).set(data).where(eq(debts.id, id)).run();
    },
  },
};
