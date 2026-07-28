import {
  AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const CATEGORY_TYPES = ["income", "expense"] as const;

/**
 * Two-level classification for transactions. `parentId` points back at this
 * same table; the AnySQLiteColumn return type is what breaks TypeScript's
 * circular inference on the self reference.
 */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type", { enum: CATEGORY_TYPES }).notNull(),
    parentId: integer("parent_id").references(
      (): AnySQLiteColumn => categories.id,
    ),
    icon: text("icon"),
    color: text("color"),
  },
  (t) => [index("category_parent_idx").on(t.parentId)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsertRow = typeof categories.$inferInsert;
export type CategoryType = (typeof CATEGORY_TYPES)[number];
