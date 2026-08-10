import {
  AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const CATEGORY_TYPES = ["income", "expense", "bill"] as const;

/**
 * Two-level classification for transactions. `parentId` points back at this
 * same table; the AnySQLiteColumn return type is what breaks TypeScript's
 * circular inference on the self reference.
 *
 * `slug` mirrors wallet_categories: it is the stable identity of a built-in
 * row, so the launch seeder can insert with onConflictDoNothing and a user may
 * still create a category whose display name collides with an existing one.
 */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // The `""` default exists only so SQLite accepts ADD COLUMN on the
    // already-shipped table — it rejects a NOT NULL column with a null
    // default. Nothing writes it: every insert goes through categoryService,
    // which derives a real slug.
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    type: text("type", { enum: CATEGORY_TYPES }).notNull(),
    parentId: integer("parent_id").references(
      (): AnySQLiteColumn => categories.id,
    ),
    icon: text("icon"),
    color: text("color"),
    isBuiltIn: integer("is_built_in", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("category_parent_idx").on(t.parentId),
    uniqueIndex("category_slug_idx").on(t.slug),
  ],
);

export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsertRow = typeof categories.$inferInsert;
export type CategoryType = (typeof CATEGORY_TYPES)[number];
