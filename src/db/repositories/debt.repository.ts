import { and, asc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "../client";
import type { DebtDirection, DebtStatus } from "../schema/debts";
import { debts } from "../schema/debts";
import { transactions } from "../schema/transactions";
import type { Debt, DebtInsert, DebtUpdate } from "../validators/debt.validator";

export type DebtWithOutstanding = Debt & { paid: number; outstanding: number };

/** Total already repaid: every transaction tagged with this debt. */
const paidExpression = sql<number>`
  COALESCE((
    SELECT SUM(${transactions.amount})
    FROM ${transactions}
    WHERE ${transactions.debtId} = ${debts.id}
  ), 0)
`;

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

  /** Debts annotated with how much has been repaid and how much is left. */
  async listWithOutstanding({
    status = "ongoing",
    direction,
  }: { status?: DebtStatus; direction?: DebtDirection } = {}): Promise<
    DebtWithOutstanding[]
  > {
    const filters: SQL[] = [eq(debts.status, status)];
    if (direction) filters.push(eq(debts.direction, direction));

    return db
      .select({
        id: debts.id,
        direction: debts.direction,
        counterparty: debts.counterparty,
        principal: debts.principal,
        walletId: debts.walletId,
        dueDate: debts.dueDate,
        status: debts.status,
        note: debts.note,
        createdAt: debts.createdAt,
        paid: paidExpression,
        outstanding: sql<number>`${debts.principal} - ${paidExpression}`,
      })
      .from(debts)
      .where(and(...filters))
      .orderBy(asc(debts.dueDate));
  },

  async getById(id: number): Promise<Debt | null> {
    const rows = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    return rows[0] ?? null;
  },

  /** Remaining balance of a single debt, in minor units. */
  async getOutstanding(id: number): Promise<number> {
    const rows = await db
      .select({
        outstanding: sql<number>`${debts.principal} - ${paidExpression}`,
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
