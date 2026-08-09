import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const COUNTERPARTY_KINDS = ["person", "institution"] as const;

/**
 * The other side of a debt: a lender, a borrower, a friend.
 *
 * `kind` is what the debt form branches on — an institution gets presets,
 * interest and a hard due date, a person gets none of that.
 */
export const counterparties = sqliteTable(
  "counterparties",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    kind: text("kind", { enum: COUNTERPARTY_KINDS }).notNull(),
    /**
     * The `debt_presets.slug` this party was created from. Plain text rather
     * than a foreign key so a preset can be retired without orphaning every
     * party made from it — same reasoning as `wallets.type`.
     */
    presetKey: text("preset_key"),
    /** Phone or email, optional. */
    contact: text("contact"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("counterparty_kind_idx").on(t.kind)],
);

export type CounterpartyRow = typeof counterparties.$inferSelect;
export type CounterpartyInsertRow = typeof counterparties.$inferInsert;
export type CounterpartyKind = (typeof COUNTERPARTY_KINDS)[number];
