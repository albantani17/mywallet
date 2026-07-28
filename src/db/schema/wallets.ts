import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Slugs of the categories seeded on first launch. */
export const BUILT_IN_WALLET_TYPES = [
  "cash",
  "bank",
  "ewallet",
  "investment",
] as const;

export type BuiltInWalletType = (typeof BUILT_IN_WALLET_TYPES)[number];

/**
 * A place money sits. `initialBalance` is the opening balance in minor units;
 * the current balance is derived from it plus the wallet's transactions
 * (see walletRepository.getBalances).
 */
export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Holds a wallet_categories.slug. Untyped on purpose — categories are user
  // extensible, so the value cannot be a closed union any more. The emitted
  // SQL is unchanged (`text NOT NULL`), so this needs no migration.
  type: text("type").notNull(),
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
/**
 * A category slug. Widened from a union now that users can add categories —
 * look icons and colours up with a fallback rather than indexing a Record,
 * since an unknown slug is reachable at runtime.
 */
export type WalletType = string;
