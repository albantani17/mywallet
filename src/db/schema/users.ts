import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const AUTH_PROVIDERS = ["guest", "google"] as const;
export const LOCALES = ["en", "id"] as const;
export const THEMES = ["light", "dark", "system"] as const;

/**
 * The single local account of this device. `email` / `avatarUrl` stay nullable
 * so upgrading a guest to a Google account later is just a column update.
 */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    authProvider: text("auth_provider", { enum: AUTH_PROVIDERS })
      .notNull()
      .default("guest"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    locale: text("locale", { enum: LOCALES }).notNull().default("id"),
    theme: text("theme", { enum: THEMES }).notNull().default("system"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // One account per device, enforced by the database: a second insert
    // (id = 2) fails the check instead of silently creating a shadow user.
    check("single_user_row", sql`${t.id} = 1`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type UserInsertRow = typeof users.$inferInsert;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];
export type Locale = (typeof LOCALES)[number];
export type Theme = (typeof THEMES)[number];
