import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const QUICK_ENTRY_ALIAS_KINDS = ["wallet", "category"] as const;

/**
 * Words this user has taught the quick-entry parser.
 *
 * Written only when a correction is confirmed: the parser guessed, the user
 * changed the answer, and the leftover words of the sentence are bound to what
 * they chose. That is what turns "warteg 20rb" into the right category on the
 * second try without anybody maintaining a dictionary.
 *
 * `phrase` is unique across both kinds rather than per kind. A word that names
 * both a wallet and a category would otherwise resolve by whichever lookup ran
 * first, which is not a decision anyone made — and the recovery path for a
 * wrong alias is to correct it again, which needs the row to be findable by
 * phrase alone.
 *
 * `targetId` is deliberately not a foreign key: wallets and categories live in
 * different tables, so no single reference can cover both. A row whose target
 * has been deleted resolves to nothing and is skipped, which is the same
 * outcome as never having learned it.
 */
export const quickEntryAliases = sqliteTable(
  "quick_entry_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Normalised at write time: lowercase, single-spaced. */
    phrase: text("phrase").notNull(),
    kind: text("kind", { enum: QUICK_ENTRY_ALIAS_KINDS }).notNull(),
    targetId: integer("target_id").notNull(),
    /** How often the alias has been confirmed, for future pruning. */
    hits: integer("hits").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("quick_entry_alias_phrase_idx").on(t.phrase),
    index("quick_entry_alias_kind_idx").on(t.kind),
    check("non_empty_phrase", sql`length(${t.phrase}) > 0`),
  ],
);

export type QuickEntryAliasRow = typeof quickEntryAliases.$inferSelect;
export type QuickEntryAliasInsertRow = typeof quickEntryAliases.$inferInsert;
export type QuickEntryAliasKind = (typeof QUICK_ENTRY_ALIAS_KINDS)[number];
