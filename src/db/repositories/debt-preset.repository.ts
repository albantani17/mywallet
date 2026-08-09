import { and, asc, eq, notInArray } from "drizzle-orm";

import { db } from "../client";
import { debtPresets } from "../schema/debt-presets";
import type {
  DebtPreset,
  DebtPresetInsert,
} from "../validators/debt-preset.validator";

/** Select builders for useLiveQuery — see the note in debt.repository.ts. */
export const debtPresetQueries = {
  list: () =>
    db
      .select()
      .from(debtPresets)
      .orderBy(asc(debtPresets.sortOrder), asc(debtPresets.id)),
};

export const debtPresetRepository = {
  async list(): Promise<DebtPreset[]> {
    return debtPresetQueries.list();
  },

  async getBySlug(slug: string): Promise<DebtPreset | null> {
    const rows = await db
      .select()
      .from(debtPresets)
      .where(eq(debtPresets.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * Inserts the built-in rows, skipping any that already exist. The unique
   * index on `slug` is what makes this safe to run on every launch.
   */
  async insertMissing(rows: DebtPresetInsert[]): Promise<void> {
    if (rows.length === 0) return;

    await db
      .insert(debtPresets)
      .values(rows)
      .onConflictDoNothing({ target: debtPresets.slug });
  },

  /**
   * Drops built-ins that have left the seed list — the brand presets a device
   * picked up before they were retired.
   *
   * Scoped to `isBuiltIn` so a preset the user made is never touched. Deleting
   * is safe here because `counterparties.presetKey` is plain text, not a
   * foreign key: a party created from a retired preset keeps working.
   */
  async removeRetiredBuiltIns(keepSlugs: string[]): Promise<void> {
    if (keepSlugs.length === 0) return;

    await db
      .delete(debtPresets)
      .where(
        and(
          eq(debtPresets.isBuiltIn, true),
          notInArray(debtPresets.slug, keepSlugs),
        ),
      );
  },
};
