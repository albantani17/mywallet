import { asc, eq } from "drizzle-orm";

import { db, type Executor } from "../client";
import { installments } from "../schema/installments";
import { paymentAllocations } from "../schema/payment-allocations";
import type {
  PaymentAllocation,
  PaymentAllocationInsert,
} from "../validators/payment-allocation.validator";

/** An allocation with the installment it landed on, for the history list. */
export type AllocationWithInstallment = PaymentAllocation & {
  sequence: number;
  dueDate: Date | null;
};

/** Select builders for useLiveQuery — see the note in debt.repository.ts. */
export const paymentAllocationQueries = {
  listByPayment: (paymentId: number) =>
    db
      .select({
        id: paymentAllocations.id,
        paymentId: paymentAllocations.paymentId,
        installmentId: paymentAllocations.installmentId,
        amount: paymentAllocations.amount,
        createdAt: paymentAllocations.createdAt,
        sequence: installments.sequence,
        dueDate: installments.dueDate,
      })
      .from(paymentAllocations)
      .innerJoin(
        installments,
        eq(installments.id, paymentAllocations.installmentId),
      )
      .where(eq(paymentAllocations.paymentId, paymentId))
      .orderBy(asc(installments.sequence)),

  listByInstallment: (installmentId: number) =>
    db
      .select()
      .from(paymentAllocations)
      .where(eq(paymentAllocations.installmentId, installmentId))
      .orderBy(asc(paymentAllocations.id)),
};

export const paymentAllocationRepository = {
  async listByPayment(paymentId: number): Promise<AllocationWithInstallment[]> {
    return paymentAllocationQueries.listByPayment(paymentId);
  },

  async listByInstallment(installmentId: number): Promise<PaymentAllocation[]> {
    return paymentAllocationQueries.listByInstallment(installmentId);
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    insertMany: (
      rows: PaymentAllocationInsert[],
      exec: Executor = db,
    ): PaymentAllocation[] =>
      rows.length === 0
        ? []
        : exec.insert(paymentAllocations).values(rows).returning().all(),
  },
};
