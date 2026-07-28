import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * The set of wallet categories, four of which ship built in.
 *
 * `wallets.type` stores the `slug` of a row here. It is deliberately not a
 * foreign key: keeping it a plain text column means existing wallets — which
 * already store "cash", "bank" and so on — need no backfill, and the table is
 * purely additive.
 *
 * Built-in rows keep their label in i18n (`wallets.types.<slug>`) so they stay
 * translated; `name` is only the fallback for those. A custom category has no
 * translation and shows its typed name in both languages.
 */
export const walletCategories = sqliteTable(
  "wallet_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** Ionicons glyph name. */
    icon: text("icon").notNull(),
    /** Hex accent, e.g. "#2f7d57". */
    color: text("color").notNull(),
    isBuiltIn: integer("is_built_in", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // What makes ensureBuiltIns() idempotent via onConflictDoNothing.
    uniqueIndex("wallet_category_slug_idx").on(t.slug),
  ],
);

export type WalletCategoryRow = typeof walletCategories.$inferSelect;
export type WalletCategoryInsertRow = typeof walletCategories.$inferInsert;
