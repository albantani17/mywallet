import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "../client";
import type { DebtDirection, DebtStatus } from "../schema/debts";
import { debts } from "../schema/debts";
import type { Debt, DebtInsert, DebtUpdate } from "../validators/debt.validator";

export type DebtWithOutstanding = Debt & { paid: number; outstanding: number };

/**
 * Total already repaid: every transaction tagged with this debt.
 *
 * The identifiers are written out literally rather than interpolated. Drizzle
 * strips table qualifiers from interpolated columns inside a SELECT list, so
 * `transactions.debt_id = debts.id` became `"debt_id" = "id"` — and since
 * `transactions` has an `id` of its own, the subquery stopped correlating to
 * the outer debt entirely. Same trap as balanceExpression in
 * wallet.repository.ts.
 */
const paidExpression = sql<number>`
  COALESCE((
    SELECT SUM("transactions"."amount")
    FROM "transactions"
    WHERE "transactions"."debt_id" = "debts"."id"
  ), 0)
`;

const debtWithOutstandingColumns = {
  id: debts.id,
  direction: debts.direction,
  counterparty: debts.counterparty,
  principal: debts.principal,
  walletId: debts.walletId,
  issuedAt: debts.issuedAt,
  dueDate: debts.dueDate,
  status: debts.status,
  note: debts.note,
  createdAt: debts.createdAt,
  paid: paidExpression,
  outstanding: sql<number>`"debts"."principal" - ${paidExpression}`,
};

/**
 * Select builders, not promises — useLiveQuery needs the builder itself to
 * subscribe to table changes. The async methods below delegate here so the SQL
 * has one definition.
 */
export const debtQueries = {
  /**
   * Debts annotated with how much has been repaid and how much is left.
   *
   * Newest first: ordering by dueDate would float every debt without one to
   * the top, since NULL sorts first in SQLite.
   */
  listWithOutstanding: ({
    status = "ongoing",
    direction,
  }: { status?: DebtStatus; direction?: DebtDirection } = {}) => {
    const filters: SQL[] = [eq(debts.status, status)];
    if (direction) filters.push(eq(debts.direction, direction));

    return db
      .select(debtWithOutstandingColumns)
      .from(debts)
      .where(and(...filters))
      .orderBy(desc(debts.issuedAt), desc(debts.id));
  },
};

export const debtRepository = {
  async list({
    status,
    direction,
  }: { status?: DebtStatus; direction?: DebtDirection } = {}): Promise<Debt[]> {
    const filters: SQL[] = [];
    if (status) filters.push(eq(debts.status, status));
    if (direction) filters.push(eq(debts.direction, direction));

    return db
      .select()
      .from(debts)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(debts.dueDate));
  },

  async listWithOutstanding(
    options: { status?: DebtStatus; direction?: DebtDirection } = {},
  ): Promise<DebtWithOutstanding[]> {
    return debtQueries.listWithOutstanding(options);
  },

  async getById(id: number): Promise<Debt | null> {
    const rows = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    return rows[0] ?? null;
  },

  /** Remaining balance of a single debt, in minor units. */
  async getOutstanding(id: number): Promise<number> {
    const rows = await db
      .select({
        outstanding: sql<number>`"debts"."principal" - ${paidExpression}`,
      })
      .from(debts)
      .where(eq(debts.id, id))
      .limit(1);
    return Number(rows[0]?.outstanding ?? 0);
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

  async settle(id: number): Promise<Debt | null> {
    return debtRepository.update(id, { status: "settled" });
  },

  async remove(id: number): Promise<void> {
    await db.delete(debts).where(eq(debts.id, id));
  },
};
