import { and, asc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";

import { db, type Executor } from "../client";
import { counterparties } from "../schema/counterparties";
import { debts } from "../schema/debts";
import { installments } from "../schema/installments";
import type {
  Installment,
  InstallmentInsert,
  InstallmentUpdate,
  InstallmentWithPaid,
} from "../validators/installment.validator";

/**
 * How much has actually landed on this installment.
 *
 * There is no `paid_amount` column to read: a cache would have to be kept in
 * step with every payment insert, delete and re-allocation, and the one time
 * it drifted the user would be told they still owe money they have paid.
 *
 * The identifiers are written out literally rather than interpolating
 * `${installments.id}`. Drizzle strips table qualifiers from interpolated
 * columns inside a SELECT list, which would turn
 * `payment_allocations.installment_id = installments.id` into
 * `"installment_id" = "id"` — and since `payment_allocations` has an `id` of
 * its own, the subquery would stop correlating to the outer installment
 * entirely. Same trap as balanceExpression in wallet.repository.ts.
 */
export const installmentPaidExpression = sql<number>`
  COALESCE((
    SELECT SUM("payment_allocations"."amount")
    FROM "payment_allocations"
    WHERE "payment_allocations"."installment_id" = "installments"."id"
  ), 0)
`;

/** What is still owed on the row; never negative. */
export const installmentRemainingExpression = sql<number>`
  MAX("installments"."total_amount" - ${installmentPaidExpression}, 0)
`;

const installmentWithPaidColumns = {
  id: installments.id,
  debtId: installments.debtId,
  sequence: installments.sequence,
  dueDate: installments.dueDate,
  originalDueDate: installments.originalDueDate,
  principalAmount: installments.principalAmount,
  interestAmount: installments.interestAmount,
  feeAmount: installments.feeAmount,
  penaltyAmount: installments.penaltyAmount,
  totalAmount: installments.totalAmount,
  isModified: installments.isModified,
  note: installments.note,
  createdAt: installments.createdAt,
  updatedAt: installments.updatedAt,
  // mapWith(Number) rather than a Number() call at every call site: SQLite can
  // hand a SUM back as a string, and useLiveQuery consumers get the row as-is.
  paidAmount: installmentPaidExpression.mapWith(Number),
  remaining: installmentRemainingExpression.mapWith(Number),
};

/** An installment plus the debt it belongs to — what the calendar row needs. */
export type UpcomingInstallment = InstallmentWithPaid & {
  debtTitle: string;
  debtDirection: string;
  counterpartyName: string | null;
  counterpartyKind: string | null;
};

/**
 * Select builders, not promises — useLiveQuery needs the builder itself to
 * subscribe to table changes. The async methods below delegate here so the SQL
 * has one definition.
 */
export const installmentQueries = {
  listByDebt: (debtId: number) =>
    db
      .select(installmentWithPaidColumns)
      .from(installments)
      .where(eq(installments.debtId, debtId))
      .orderBy(asc(installments.sequence)),

  /**
   * Everything still owed with a due date in the window, across every active
   * debt. Drives the dashboard's "due in the next 30 days".
   */
  upcoming: ({ from, to }: { from: Date; to: Date }) =>
    db
      .select({
        ...installmentWithPaidColumns,
        debtTitle: debts.title,
        debtDirection: debts.direction,
        counterpartyName: counterparties.name,
        counterpartyKind: counterparties.kind,
      })
      .from(installments)
      .innerJoin(debts, eq(debts.id, installments.debtId))
      .leftJoin(counterparties, eq(counterparties.id, debts.counterpartyId))
      .where(
        and(
          eq(debts.status, "active"),
          gte(installments.dueDate, from),
          lte(installments.dueDate, to),
          sql`${installmentRemainingExpression} > 0`,
        ),
      )
      .orderBy(asc(installments.dueDate), asc(installments.sequence)),
};

export const installmentRepository = {
  async listByDebt(debtId: number): Promise<InstallmentWithPaid[]> {
    return installmentQueries.listByDebt(debtId);
  },

  async upcoming(range: { from: Date; to: Date }): Promise<UpcomingInstallment[]> {
    return installmentQueries.upcoming(range) as Promise<UpcomingInstallment[]>;
  },

  async getById(id: number): Promise<Installment | null> {
    const rows = await db
      .select()
      .from(installments)
      .where(eq(installments.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * The rows an incoming payment may be spread over, oldest first. Ordering is
   * only a hint here — payment-allocator sorts properly, because SQLite puts
   * NULL first and would float an open debt's dateless row above dated ones.
   */
  async listAllocatable(debtId: number): Promise<InstallmentWithPaid[]> {
    return installmentQueries.listByDebt(debtId);
  },

  /** Which of these installments already carry an allocation — regenerate skips them. */
  async findAllocatedIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];

    const rows = await db
      .select({ id: installments.id })
      .from(installments)
      .where(
        and(inArray(installments.id, ids), sql`${installmentPaidExpression} > 0`),
      );

    return rows.map((row) => row.id);
  },

  async update(id: number, data: InstallmentUpdate): Promise<Installment | null> {
    const [row] = await db
      .update(installments)
      .set(data)
      .where(eq(installments.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Synchronous variants for use inside a db.transaction callback, which must
   * never await — see the Executor note in client.ts.
   */
  sync: {
    /**
     * The rows with what has landed on each — what the allocator plans against
     * and what decides whether the debt is now settled, both of which have to
     * be read inside the same transaction that writes the allocations.
     */
    listWithPaid: (debtId: number, exec: Executor = db): InstallmentWithPaid[] =>
      exec
        .select(installmentWithPaidColumns)
        .from(installments)
        .where(eq(installments.debtId, debtId))
        .orderBy(asc(installments.sequence))
        .all() as InstallmentWithPaid[],

    listByDebt: (debtId: number, exec: Executor = db): Installment[] =>
      exec
        .select()
        .from(installments)
        .where(eq(installments.debtId, debtId))
        .orderBy(asc(installments.sequence))
        .all(),

    insertMany: (rows: InstallmentInsert[], exec: Executor = db): Installment[] =>
      rows.length === 0
        ? []
        : exec.insert(installments).values(rows).returning().all(),

    update: (id: number, data: InstallmentUpdate, exec: Executor = db): void => {
      exec.update(installments).set(data).where(eq(installments.id, id)).run();
    },

    deleteByIds: (ids: number[], exec: Executor = db): void => {
      if (ids.length === 0) return;
      exec.delete(installments).where(inArray(installments.id, ids)).run();
    },
  },
};

/** Re-exported so debt.repository can build its own filters on the same shape. */
export const installmentFilters = {
  unpaid: (): SQL => sql`${installmentRemainingExpression} > 0`,
};
