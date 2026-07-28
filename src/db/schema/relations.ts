import { relations } from "drizzle-orm";

import { categories } from "./categories";
import { debts } from "./debts";
import { transactions } from "./transactions";
import { wallets } from "./wallets";

export const walletsRelations = relations(wallets, ({ many }) => ({
  // A wallet is the source of some transactions and the destination of others,
  // so both sides need an explicit relationName to stay distinguishable.
  outgoingTransactions: many(transactions, { relationName: "sourceWallet" }),
  incomingTransactions: many(transactions, { relationName: "targetWallet" }),
  debts: many(debts),
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

export const debtsRelations = relations(debts, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [debts.walletId],
    references: [wallets.id],
  }),
  transactions: many(transactions),
}));

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
