import { relations } from "drizzle-orm";

import { categories } from "./categories";
import { counterparties } from "./counterparties";
import { debtSchedules } from "./debt-schedules";
import { debts } from "./debts";
import { installments } from "./installments";
import { paymentAllocations } from "./payment-allocations";
import { payments } from "./payments";
import { transactions } from "./transactions";
import { wallets } from "./wallets";

export const walletsRelations = relations(wallets, ({ many }) => ({
  // A wallet is the source of some transactions and the destination of others,
  // so both sides need an explicit relationName to stay distinguishable.
  outgoingTransactions: many(transactions, { relationName: "sourceWallet" }),
  incomingTransactions: many(transactions, { relationName: "targetWallet" }),
  debts: many(debts),
  payments: many(payments),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryTree",
  }),
  children: many(categories, { relationName: "categoryTree" }),
  transactions: many(transactions),
}));

export const counterpartiesRelations = relations(
  counterparties,
  ({ many }) => ({
    debts: many(debts),
  }),
);

export const debtsRelations = relations(debts, ({ one, many }) => ({
  counterparty: one(counterparties, {
    fields: [debts.counterpartyId],
    references: [counterparties.id],
  }),
  wallet: one(wallets, {
    fields: [debts.walletId],
    references: [wallets.id],
  }),
  // 1:1 in practice — the unique index on debt_schedules.debtId enforces it —
  // but drizzle models the referenced side of a foreign key as `many`.
  schedule: many(debtSchedules),
  installments: many(installments),
  payments: many(payments),
  transactions: many(transactions),
}));

export const debtSchedulesRelations = relations(debtSchedules, ({ one }) => ({
  debt: one(debts, {
    fields: [debtSchedules.debtId],
    references: [debts.id],
  }),
}));

export const installmentsRelations = relations(
  installments,
  ({ one, many }) => ({
    debt: one(debts, {
      fields: [installments.debtId],
      references: [debts.id],
    }),
    allocations: many(paymentAllocations),
  }),
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  debt: one(debts, {
    fields: [payments.debtId],
    references: [debts.id],
  }),
  wallet: one(wallets, {
    fields: [payments.walletId],
    references: [wallets.id],
  }),
  transaction: one(transactions, {
    fields: [payments.transactionId],
    references: [transactions.id],
  }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),
    installment: one(installments, {
      fields: [paymentAllocations.installmentId],
      references: [installments.id],
    }),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
    relationName: "sourceWallet",
  }),
  toWallet: one(wallets, {
    fields: [transactions.toWalletId],
    references: [wallets.id],
    relationName: "targetWallet",
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  debt: one(debts, {
    fields: [transactions.debtId],
    references: [debts.id],
  }),
}));
