import { asc, eq, sql } from "drizzle-orm";

import { db } from "../client";
import { quickEntryAliases } from "../schema/quick-entry-aliases";
import type {
  QuickEntryAlias,
  QuickEntryAliasInsert,
} from "../validators/quick-entry-alias.validator";

/** Select builders for useLiveQuery — see the note in wallet.repository.ts. */
export const quickEntryAliasQueries = {
  list: () =>
    db.select().from(quickEntryAliases).orderBy(asc(quickEntryAliases.phrase)),
};

export const quickEntryAliasRepository = {
  async list(): Promise<QuickEntryAlias[]> {
    return quickEntryAliasQueries.list();
  },

  /**
   * Records a lesson, or replaces the one already stored for that phrase.
   *
   * Replacing rather than refusing is the recovery path: an alias learnt by
   * mistake is corrected the same way it was created, by correcting the field
   * again. Without that there would be no way back short of a settings screen
   * nobody would find.
   */
  async upsert(data: QuickEntryAliasInsert): Promise<void> {
    await db
      .insert(quickEntryAliases)
      .values(data)
      .onConflictDoUpdate({
        target: quickEntryAliases.phrase,
        set: {
          kind: data.kind,
          targetId: data.targetId,
          hits: sql`${quickEntryAliases.hits} + 1`,
          lastUsedAt: new Date(),
        },
      });
  },

  async removeByPhrase(phrase: string): Promise<void> {
    await db.delete(quickEntryAliases).where(eq(quickEntryAliases.phrase, phrase));
  },
};
