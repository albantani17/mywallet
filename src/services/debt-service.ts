import {
  categoryRepository,
  counterpartyRepository,
  db,
  debtInsertSchema,
  debtRepository,
  debtScheduleInsertSchema,
  debtScheduleRepository,
  installmentInsertSchema,
  installmentRepository,
  paymentAllocationRepository,
  paymentInsertSchema,
  paymentRepository,
  transactionRepository,
  transactionInsertSchema,
} from "@/db";
import type {
  Counterparty,
  CounterpartyKind,
  Debt,
  DebtDirection,
  DebtSchedule,
  DebtUpdate,
  InstallmentUpdate,
  InstallmentWithPaid,
  InterestMethod,
  IntervalUnit,
  Payment,
  PaymentMethod,
  ScheduleType,
} from "@/db";

import {
  buildCustomInstallments,
  type CustomInstallmentInput,
} from "./custom-installments";
import { summarise } from "./debt-status";
import {
  planAllocation,
  validateAllocations,
  type AllocationInput,
} from "./payment-allocator";
import {
  generateInstallments,
  type GeneratorSchedule,
} from "./schedule-generator";

/**
 * Everything that writes to the debt module.
 *
 * Each operation spans several tables — a debt without its schedule, or a
 * payment without its allocations, is worse than no row at all — so the writes
 * run inside one `db.transaction`. That callback must stay SYNCHRONOUS: an
 * async one commits at the first await, leaving the rest outside the
 * transaction. Hence the `sync` repository variants throughout, and hence no
 * `await` anywhere inside a transaction body.
 */

export type CounterpartyRef =
  | { id: number }
  | { name: string; kind: CounterpartyKind; presetKey?: string | null };

export type CreateDebtInput = {
  counterparty: CounterpartyRef;
  direction: DebtDirection;
  title: string;
  principal: number;
  interestRateBps?: number;
  interestMethod?: InterestMethod;
  originDate: Date;
  walletId?: number | null;
  note?: string | null;

  schedule: {
    scheduleType: ScheduleType;
    anchorDate?: Date | null;
    dueDay?: number | null;
    intervalUnit?: IntervalUnit | null;
    intervalCount?: number | null;
    periodCount?: number | null;
    graceDays?: number;
    reminderDays?: number;
    roundingUnit?: number;
    /** Fixed total per installment; derives the interest instead of charging it. */
    installmentAmount?: number | null;
  };

  /**
   * Also book the disbursement as cash flow: money arriving for a `payable`,
   * money leaving for a `receivable`. Optional — plenty of debts are recorded
   * after the fact, and booking one twice is the worse error.
   */
  recordCashFlow?: boolean;

  /**
   * The rows the user typed from the lender's paper. Required for a `custom`
   * schedule and ignored for every other type, where the generator owns them.
   */
  customInstallments?: CustomInstallmentInput[];
};

export type CreateDebtResult = {
  debt: Debt;
  schedule: DebtSchedule;
  installmentCount: number;
};

export type RecordPaymentInput = {
  debtId: number;
  amount: number;
  paidAt: Date;
  walletId?: number | null;
  method?: PaymentMethod | null;
  reference?: string | null;
  note?: string | null;
  /**
   * Manual split, in the advanced section of the form. Omitted means automatic:
   * oldest outstanding installment first.
   */
  allocations?: AllocationInput[];
  /** Book the movement against the wallet as well. Default true when a wallet is given. */
  recordCashFlow?: boolean;
};

export type RecordPaymentResult = {
  payment: Payment;
  allocated: number;
  /** Money the payment could not place — every installment was already full. */
  unallocated: number;
  outstanding: number;
  isSettled: boolean;
};

/** Which installments a schedule change is allowed to touch. */
export type RegenerateScope = "forward" | "all";

const trimmed = (value?: string | null) =>
  value?.trim() ? value.trim() : null;

/**
 * A payable brings money in and is repaid out; a receivable is the mirror.
 * Used for both the disbursement and the repayment, in opposite directions.
 */
function cashFlowType(
  direction: DebtDirection,
  event: "disbursement" | "repayment",
): "income" | "expense" {
  const incoming =
    direction === "payable" ? event === "disbursement" : event === "repayment";
  return incoming ? "income" : "expense";
}

/**
 * The built-in category each of the four cash-flow events belongs to.
 *
 * Four slugs rather than one "Debt" bucket: borrowing, repaying, lending and
 * being repaid are opposite events, and a report that merges them says nothing.
 * The slugs are seeded in BUILT_IN_TRANSACTION_CATEGORY_SEEDS.
 */
function cashFlowCategorySlug(
  direction: DebtDirection,
  event: "disbursement" | "repayment",
): string {
  if (direction === "payable") {
    return event === "disbursement" ? "loan-received" : "debt-repayment";
  }
  return event === "disbursement" ? "money-lent" : "loan-collected";
}

/**
 * Resolved before the write transaction opens, because the transaction body is
 * synchronous and cannot await.
 *
 * A missing row means the seeder has not run yet on this device. That leaves
 * the transaction uncategorised, which is exactly the old behaviour — recording
 * the money matters more than labelling it.
 */
async function resolveCashFlowCategoryId(
  direction: DebtDirection,
  event: "disbursement" | "repayment",
): Promise<number | null> {
  const category = await categoryRepository.getBySlug(
    cashFlowCategorySlug(direction, event),
  );
  return category?.id ?? null;
}

export const debtService = {
  /**
   * Creates the debt, its schedule and every installment in one go.
   *
   * The generator runs here and only here (plus `regenerate`). Its output is
   * written as rows; nothing recomputes a due date from the rule afterwards,
   * so a later restructure or penalty survives.
   */
  async createDebt(input: CreateDebtInput): Promise<CreateDebtResult> {
    // Checked before anything is written: a custom schedule whose rows never
    // arrived would otherwise create a debt with no installments at all, which
    // reads on screen as a debt of zero.
    if (
      input.schedule.scheduleType === "custom" &&
      !input.customInstallments?.length
    ) {
      throw new Error("A custom schedule needs at least one installment.");
    }

    // Resolving the counterparty needs a read, so it happens before the
    // transaction opens rather than inside a callback that cannot await.
    const counterparty = await resolveCounterparty(input.counterparty);

    // Looked up here for the same reason as the counterparty: the transaction
    // callback below is synchronous.
    const cashFlowCategoryId =
      input.recordCashFlow && input.walletId
        ? await resolveCashFlowCategoryId(input.direction, "disbursement")
        : null;

    const debtPayload = debtInsertSchema.parse({
      counterpartyId: counterparty.id,
      walletId: input.walletId ?? null,
      direction: input.direction,
      title: input.title,
      principal: input.principal,
      interestRateBps: input.interestRateBps ?? 0,
      interestMethod: input.interestMethod ?? "none",
      originDate: input.originDate,
      note: trimmed(input.note),
    });

    const scheduleInput = input.schedule;

    return db.transaction((tx) => {
      const debt = debtRepository.sync.insert(debtPayload, tx);

      const schedule = debtScheduleRepository.sync.insert(
        debtScheduleInsertSchema.parse({
          debtId: debt.id,
          scheduleType: scheduleInput.scheduleType,
          anchorDate: scheduleInput.anchorDate ?? null,
          dueDay: scheduleInput.dueDay ?? null,
          intervalUnit: scheduleInput.intervalUnit ?? null,
          intervalCount: scheduleInput.intervalCount ?? null,
          periodCount: scheduleInput.periodCount ?? null,
          installmentAmount: scheduleInput.installmentAmount ?? null,
          graceDays: scheduleInput.graceDays ?? 0,
          reminderDays: scheduleInput.reminderDays ?? 3,
          roundingUnit: scheduleInput.roundingUnit ?? 1000,
        }),
        tx,
      );

      // A custom schedule has no formula behind it: the user copied the rows
      // off the lender's paper, so they are taken as given.
      const generated =
        scheduleInput.scheduleType === "custom"
          ? buildCustomInstallments(input.customInstallments ?? [])
          : generateInstallments(debt, schedule);

      const rows = generated.map((row) =>
        installmentInsertSchema.parse({ ...row, debtId: debt.id }),
      );
      installmentRepository.sync.insertMany(rows, tx);

      if (input.recordCashFlow && debt.walletId) {
        transactionRepository.sync.insert(
          transactionInsertSchema.parse({
            type: cashFlowType(debt.direction, "disbursement"),
            amount: debt.principal,
            walletId: debt.walletId,
            categoryId: cashFlowCategoryId,
            occurredAt: debt.originDate,
            note: debt.title,
            // Deliberately untagged: `debtId` on a transaction means
            // "repayment", and the repayment sums would count the
            // disbursement as money already paid back.
            debtId: null,
          }),
          tx,
        );
      }

      return { debt, schedule, installmentCount: rows.length };
    });
  },

  async updateDebt(id: number, data: DebtUpdate): Promise<Debt | null> {
    return debtRepository.update(id, data);
  },

  /**
   * Deletes a debt, but only while it is still untouched.
   *
   * Once money has moved against it, deleting would silently take those
   * payments with it by cascade. Cancelling keeps the history and the cash
   * flow rows intact, which is what the user actually means.
   */
  async removeDebt(id: number): Promise<void> {
    const paymentCount = await paymentRepository.countByDebt(id);
    if (paymentCount > 0) {
      throw new Error(
        "This debt already has payments recorded. Cancel it instead of deleting it, so the payment history is kept.",
      );
    }

    await debtRepository.remove(id);
  },

  /** Marks a debt cancelled or written off without touching its history. */
  async closeDebt(
    id: number,
    status: "cancelled" | "written_off",
  ): Promise<Debt | null> {
    return debtRepository.update(id, { status, closedAt: new Date() });
  },

  /**
   * Rebuilds the installments from the (possibly edited) schedule.
   *
   * Two kinds of row are off limits: one the user edited by hand
   * (`isModified`) and one that already has money on it. Both represent facts
   * the formula does not know, and overwriting either would quietly discard
   * them. `scope: "forward"` additionally protects everything already due —
   * the "this and following" option from the calendar-style prompt.
   */
  async regenerate(
    debtId: number,
    { scope = "all", from = new Date() }: { scope?: RegenerateScope; from?: Date } = {},
  ): Promise<{ replaced: number; kept: number }> {
    const debt = await debtRepository.getById(debtId);
    if (!debt) throw new Error("Debt not found");

    const schedule = await debtScheduleRepository.getByDebt(debtId);
    if (!schedule) throw new Error("This debt has no schedule to regenerate from");

    const existing = await installmentRepository.listByDebt(debtId);

    const isProtected = (installment: InstallmentWithPaid) =>
      installment.isModified ||
      installment.paidAmount > 0 ||
      (scope === "forward" &&
        installment.dueDate !== null &&
        installment.dueDate.getTime() < from.getTime());

    const kept = existing.filter(isProtected);
    const replaceable = existing.filter((i) => !isProtected(i));
    const keptSequences = new Set(kept.map((i) => i.sequence));

    const generated = generateInstallments(debt, schedule);

    return db.transaction((tx) => {
      installmentRepository.sync.deleteByIds(
        replaceable.map((i) => i.id),
        tx,
      );

      // A protected row holds its sequence number; the generator's row for that
      // slot is dropped rather than renumbered, so #5 stays #5 on screen and in
      // the payment history.
      const rows = generated
        .filter((row) => !keptSequences.has(row.sequence))
        .map((row) => installmentInsertSchema.parse({ ...row, debtId }));

      installmentRepository.sync.insertMany(rows, tx);

      return { replaced: rows.length, kept: kept.length };
    });
  },

  /**
   * Edits one installment: a moved date, a renegotiated amount, a late fee.
   *
   * Always flags the row `isModified`, which is what tells a later regenerate
   * to leave it alone.
   */
  async editInstallment(
    id: number,
    data: InstallmentUpdate,
  ): Promise<void> {
    await installmentRepository.update(id, { ...data, isModified: true });
  },

  /**
   * Previews where a payment would land, without writing anything.
   *
   * The form shows this before the confirm button — "Rp 1.000.000 → covers #3
   * and #4" — because a split the user cannot see is a split they cannot
   * correct.
   */
  async previewAllocation(debtId: number, amount: number) {
    const installments = await installmentRepository.listAllocatable(debtId);
    return planAllocation(amount, installments);
  },

  /**
   * Records a payment and everything it settles, in one transaction.
   *
   * The allocations, the optional cash-flow row and the debt's own settled
   * status all commit together or not at all. A half-written payment is
   * exactly the state that makes an outstanding total drift.
   */
  async recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult> {
    const debt = await debtRepository.getById(input.debtId);
    if (!debt) throw new Error("Debt not found");

    const paymentPayload = paymentInsertSchema.parse({
      debtId: input.debtId,
      walletId: input.walletId ?? null,
      paidAt: input.paidAt,
      amount: input.amount,
      method: input.method ?? null,
      reference: trimmed(input.reference),
      note: trimmed(input.note),
    });

    const wantsCashFlow = input.recordCashFlow ?? Boolean(input.walletId);
    const cashFlowCategoryId =
      wantsCashFlow && paymentPayload.walletId
        ? await resolveCashFlowCategoryId(debt.direction, "repayment")
        : null;

    return db.transaction((tx) => {
      // Read inside the transaction: two payments entered at once would
      // otherwise both plan against the same stale paid amounts and together
      // overshoot what is owed.
      const installments = installmentRepository.sync.listWithPaid(
        input.debtId,
        tx,
      );

      const plan = input.allocations
        ? {
            allocations: input.allocations.map((a) => ({ ...a })),
            allocated: input.allocations.reduce((sum, a) => sum + a.amount, 0),
            unallocated:
              paymentPayload.amount -
              input.allocations.reduce((sum, a) => sum + a.amount, 0),
          }
        : planAllocation(paymentPayload.amount, installments);

      const error = validateAllocations(
        paymentPayload.amount,
        plan.allocations,
        installments,
      );
      // Throwing rolls the transaction back, so a rejected split leaves no
      // payment row behind either.
      if (error) throw new Error(error);

      let transactionId: number | null = null;
      if (wantsCashFlow && paymentPayload.walletId) {
        const cashFlow = transactionRepository.sync.insert(
          transactionInsertSchema.parse({
            type: cashFlowType(debt.direction, "repayment"),
            amount: paymentPayload.amount,
            walletId: paymentPayload.walletId,
            categoryId: cashFlowCategoryId,
            occurredAt: paymentPayload.paidAt,
            note: paymentPayload.note ?? debt.title,
            // This one IS tagged: it is a repayment, and the link is what
            // stops the same money being counted twice.
            debtId: debt.id,
          }),
          tx,
        );
        transactionId = cashFlow.id;
      }

      const payment = paymentRepository.sync.insert(
        { ...paymentPayload, transactionId },
        tx,
      );

      paymentAllocationRepository.sync.insertMany(
        plan.allocations.map((allocation) => ({
          paymentId: payment.id,
          installmentId: allocation.installmentId,
          amount: allocation.amount,
        })),
        tx,
      );

      // Re-read rather than adding the plan to the earlier snapshot: the
      // database is the only place that knows what every allocation now sums to.
      const after = installmentRepository.sync.listWithPaid(input.debtId, tx);
      const progress = summarise(after);

      if (progress.isSettled && debt.status === "active") {
        debtRepository.sync.update(
          debt.id,
          { status: "settled", closedAt: new Date() },
          tx,
        );
      }

      return {
        payment,
        allocated: plan.allocated,
        unallocated: plan.unallocated,
        outstanding: progress.outstanding,
        isSettled: progress.isSettled,
      };
    });
  },

  /**
   * Deletes a payment, its allocations and the cash-flow row it created.
   *
   * Since paid amounts are summed rather than stored, nothing needs
   * recalculating — but a debt settled by this payment has to reopen, or it
   * would sit closed while money is owed again.
   */
  async removePayment(id: number): Promise<void> {
    const payment = await paymentRepository.getById(id);
    if (!payment) return;

    const debt = await debtRepository.getById(payment.debtId);

    db.transaction((tx) => {
      // The allocations go with it by cascade.
      paymentRepository.sync.remove(payment.id, tx);

      if (payment.transactionId) {
        transactionRepository.sync.remove(payment.transactionId, tx);
      }

      if (debt?.status === "settled") {
        const progress = summarise(
          installmentRepository.sync.listWithPaid(payment.debtId, tx),
        );
        if (!progress.isSettled) {
          debtRepository.sync.update(
            debt.id,
            { status: "active", closedAt: null },
            tx,
          );
        }
      }
    });
  },

  /** Totals for the dashboard, plus what falls due in the next `days` days. */
  async getSummary({
    days = 30,
    now = new Date(),
  }: { days?: number; now?: Date } = {}) {
    const to = new Date(now.getTime() + days * 86_400_000);

    const [totals, upcoming] = await Promise.all([
      debtRepository.totalsByDirection(now),
      installmentRepository.upcoming({ from: now, to }),
    ]);

    const forDirection = (direction: DebtDirection) =>
      totals.find((row) => row.direction === direction) ?? {
        direction,
        outstanding: 0,
        debtCount: 0,
        overdueCount: 0,
      };

    return {
      /** What the user owes. */
      payable: forDirection("payable"),
      /** What is owed to the user. */
      receivable: forDirection("receivable"),
      upcoming,
    };
  },
};

/**
 * Find-or-create by name within a kind.
 *
 * Typing "Budi" twice must not produce two Budis, or the per-counterparty
 * totals split in half without the user ever seeing why.
 */
async function resolveCounterparty(ref: CounterpartyRef): Promise<Counterparty> {
  if ("id" in ref) {
    const existing = await counterpartyRepository.getById(ref.id);
    if (!existing) throw new Error("Counterparty not found");
    return existing;
  }

  const name = ref.name.trim();
  const existing = await counterpartyRepository.findByName(name, ref.kind);
  if (existing) return existing;

  return counterpartyRepository.create({
    name,
    kind: ref.kind,
    presetKey: ref.presetKey ?? null,
  });
}
