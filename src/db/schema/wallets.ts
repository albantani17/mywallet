import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const WALLET_TYPES = ["cash", "bank", "ewallet", "investment"] as const;

/**
 * A place money sits. `initialBalance` is the opening balance in minor units;
 * the current balance is derived from it plus the wallet's transactions
 * (see walletRepository.getBalances).
 */
export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: WALLET_TYPES }).notNull(),
  initialBalance: integer("initial_balance").notNull().default(0),
  currency: text("currency").notNull().default("IDR"),
  icon: text("icon"),
  color: text("color"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export type WalletRow = typeof wallets.$inferSelect;
export type WalletInsertRow = typeof wallets.$inferInsert;
export type WalletType = (typeof WALLET_TYPES)[number];
