import { desc, eq, sql } from "drizzle-orm";

import { db, type Executor } from "../client";
import { payments } from "../schema/payments";
import { wallets } from "../schema/wallets";
import type {
  Payment,
  PaymentInsert,
  PaymentUpdate,
  PaymentWithAllocations,
} from "../validators/payment.validator";

/**
 * How much of this payment reached an installment. `amount - allocated` is
 * money the payment could not place — the history screen shows it rather than
 * letting it quietly vanish, which is how a total drifts without anyone
 * noticing.
 *
 * Identifiers are literal — see the note in installment.repository.ts.
 */
const allocatedExpression = sql<number>`
  COALESCE((
    SELECT SUM("payment_allocations"."amount")
    FROM "payment_allocations"
    WHERE "payment_allocations"."payment_id" = "payments"."id"
  ), 0)
`;

const paymentWithAllocationsColumns = {
  id: payments.id,
  debtId: payments.debtId,
  walletId: payments.walletId,
  transactionId: payments.transactionId,
  paidAt: payments.paidAt,
  amount: payments.amount,
  method: payments.method,
  reference: payments.reference,
  note: payments.note,
  createdAt: payments.createdAt,

  walletName: wallets.name,
  allocated: allocatedExpression.mapWith(Number),
  unallocated: sql<number>`"payments"."amount" - ${allocatedExpression}`.mapWith(
    Number,
  ),
};

/** Select builders for useLiveQuery — see the note in debt.repository.ts. */
export const paymentQueries = {
  listByDebt: (debtId: number) =>
    db
      .select(paymentWithAllocationsColumns)
      .from(payments)
      .leftJoin(wallets, eq(wallets.id, payments.walletId))
      .where(eq(payments.debtId, debtId))
      .orderBy(desc(payments.paidAt), desc(payments.id)),
};

export const paymentRepository = {
  async listByDebt(debtId: number): Promise<PaymentWithAllocations[]> {
    return paymentQueries.listByDebt(debtId) as Promise<PaymentWithAllocations[]>;
  },

  async getById(id: number): Promise<Payment | null> {
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async countByDebt(debtId: number): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(payments)
      .where(eq(payments.debtId, debtId));
    return rows[0]?.count ?? 0;
  },

  async create(data: PaymentInsert): Promise<Payment> {
    const [row] = await db.insert(payments).values(data).returning();
    return row;
  },

  async update(id: number, data: PaymentUpdate): Promise<Payment | null> {
    const [row] = await db
      .update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return row ?? null;
  },

  /** Removes the payment and, by cascade, its allocations. */
  async remove(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    insert: (data: PaymentInsert, exec: Executor = db): Payment => {
      const [row] = exec.insert(payments).values(data).returning().all();
      return row;
    },

    remove: (id: number, exec: Executor = db): void => {
      exec.delete(payments).where(eq(payments.id, id)).run();
    },
  },
};
