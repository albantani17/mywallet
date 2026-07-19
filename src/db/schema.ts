import { sql } from "drizzle-orm";
import {
  AnySQLiteColumn,
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    authProvider: text("auth_provider", { enum: ["guest", "google"] })
      .notNull()
      .default("guest"),
    email: text("email"), // nullable — cadangan untuk Google login nanti
    avatarUrl: text("avatar_url"),
    locale: text("locale", { enum: ["en", "id"] })
      .notNull()
      .default("id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // Batasi tabel user hanya 1 baris di level DB: insert kedua (id=2) gagal check.
    check("single_user_row", sql`${t.id} = 1`),
  ],
);

export const walletsTable = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["cash", "bank", "ewallet", "investment"],
  }).notNull(),
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
    .$onUpdateFn(() => new Date()),
});

export const categoriesTable = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["income", "expense"],
  }).notNull(),
  parentId: integer("parent_id").references(
    (): AnySQLiteColumn => categoriesTable.id,
  ),
  icon: text("icon"),
  color: text("color"),
});

export const debtsTable = sqliteTable("debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  direction: text("direction", {
    enum: ["payable", "receivable"],
  }).notNull(),
  counterparty: text("counterparty").notNull(),
  principal: integer("principal").notNull(),
  walletId: integer("wallet_id").references(() => walletsTable.id),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status", { enum: ["ongoing", "settled"] })
    .notNull()
    .default("ongoing"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", {
      enum: ["income", "expense", "transfer"],
    }).notNull(),
    amount: integer("amount").notNull(), // SELALU positif
    walletId: integer("wallet_id")
      .notNull()
      .references(() => walletsTable.id),
    toWalletId: integer("to_wallet_id").references(() => walletsTable.id), // transfer only
    categoryId: integer("category_id").references(() => categoriesTable.id),
    debtId: integer("debt_id").references(() => debtsTable.id), // kalau terkait hutang
    fee: integer("fee").notNull().default(0), // biaya admin transfer
    note: text("note"),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("tx_wallet_idx").on(t.walletId),
    index("tx_to_wallet_idx").on(t.toWalletId),
    index("tx_date_idx").on(t.occurredAt),
    index("tx_debt_idx").on(t.debtId),

    check("positive_amount", sql`${t.amount} > 0`),
    check("non_negative_fee", sql`${t.fee} >= 0`),
    check(
      "no_self_transfer",
      sql`${t.toWalletId} IS NULL OR ${t.walletId} != ${t.toWalletId}`,
    ),
    check(
      "transfer_shape",
      sql`
    (${t.type} = 'transfer' AND ${t.toWalletId} IS NOT NULL AND ${t.categoryId} IS NULL)
    OR
    (${t.type} != 'transfer' AND ${t.toWalletId} IS NULL)
  `,
    ),
  ],
);
