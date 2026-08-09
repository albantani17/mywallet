import { and, asc, eq, like, sql } from "drizzle-orm";

import { db, type Executor } from "../client";
import type { CounterpartyKind } from "../schema/counterparties";
import { counterparties } from "../schema/counterparties";
import type {
  Counterparty,
  CounterpartyInsert,
  CounterpartyUpdate,
  CounterpartyWithUsage,
} from "../validators/counterparty.validator";

/**
 * How many debts point at this party. Blocks a delete, since the foreign key
 * is ON DELETE no action and would otherwise fail with a raw SQLite error.
 *
 * Identifiers are literal — see the note in installment.repository.ts.
 */
const debtCountExpression = sql<number>`
  (SELECT COUNT(*) FROM "debts"
    WHERE "debts"."counterparty_id" = "counterparties"."id")
`;

const counterpartyWithUsageColumns = {
  id: counterparties.id,
  name: counterparties.name,
  kind: counterparties.kind,
  presetKey: counterparties.presetKey,
  contact: counterparties.contact,
  note: counterparties.note,
  createdAt: counterparties.createdAt,
  updatedAt: counterparties.updatedAt,
  debtCount: debtCountExpression.mapWith(Number),
};

/** Select builders for useLiveQuery — see the note in debt.repository.ts. */
export const counterpartyQueries = {
  list: ({ kind }: { kind?: CounterpartyKind } = {}) =>
    db
      .select(counterpartyWithUsageColumns)
      .from(counterparties)
      .where(kind ? eq(counterparties.kind, kind) : undefined)
      .orderBy(asc(counterparties.name), asc(counterparties.id)),

  search: (term: string, { kind }: { kind?: CounterpartyKind } = {}) => {
    const filters = [like(counterparties.name, `%${term}%`)];
    if (kind) filters.push(eq(counterparties.kind, kind));

    return db
      .select(counterpartyWithUsageColumns)
      .from(counterparties)
      .where(and(...filters))
      .orderBy(asc(counterparties.name), asc(counterparties.id));
  },
};

export const counterpartyRepository = {
  async list(
    options: { kind?: CounterpartyKind } = {},
  ): Promise<CounterpartyWithUsage[]> {
    return counterpartyQueries.list(options);
  },

  async getById(id: number): Promise<Counterparty | null> {
    const rows = await db
      .select()
      .from(counterparties)
      .where(eq(counterparties.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /** Exact name match within a kind — what find-or-create looks up. */
  async findByName(
    name: string,
    kind: CounterpartyKind,
  ): Promise<Counterparty | null> {
    const rows = await db
      .select()
      .from(counterparties)
      .where(and(eq(counterparties.name, name), eq(counterparties.kind, kind)))
      .limit(1);
    return rows[0] ?? null;
  },

  async getDebtCount(id: number): Promise<number> {
    const rows = await db
      .select({ debtCount: debtCountExpression.mapWith(Number) })
      .from(counterparties)
      .where(eq(counterparties.id, id))
      .limit(1);
    return rows[0]?.debtCount ?? 0;
  },

  async create(data: CounterpartyInsert): Promise<Counterparty> {
    const [row] = await db.insert(counterparties).values(data).returning();
    return row;
  },

  async update(
    id: number,
    data: CounterpartyUpdate,
  ): Promise<Counterparty | null> {
    const [row] = await db
      .update(counterparties)
      .set(data)
      .where(eq(counterparties.id, id))
      .returning();
    return row ?? null;
  },

  async remove(id: number): Promise<void> {
    await db.delete(counterparties).where(eq(counterparties.id, id));
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    insert: (data: CounterpartyInsert, exec: Executor = db): Counterparty => {
      const [row] = exec.insert(counterparties).values(data).returning().all();
      return row;
    },
  },
};
