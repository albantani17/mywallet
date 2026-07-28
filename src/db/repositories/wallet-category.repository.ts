import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../client";
import { walletCategories } from "../schema/wallet-categories";
import type {
  WalletCategory,
  WalletCategoryInsert,
} from "../validators/wallet-category.validator";

/** Select builders for useLiveQuery — see the note in wallet.repository.ts. */
export const walletCategoryQueries = {
  list: () =>
    db
      .select()
      .from(walletCategories)
      .orderBy(asc(walletCategories.sortOrder), asc(walletCategories.id)),
};

export const walletCategoryRepository = {
  async list(): Promise<WalletCategory[]> {
    return walletCategoryQueries.list();
  },

  async getBySlug(slug: string): Promise<WalletCategory | null> {
    const rows = await db
      .select()
      .from(walletCategories)
      .where(eq(walletCategories.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  },

  /** Which of the given slugs already exist — used to make a slug unique. */
  async findExistingSlugs(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) return [];

    const rows = await db
      .select({ slug: walletCategories.slug })
      .from(walletCategories)
      .where(inArray(walletCategories.slug, slugs));

    return rows.map((row) => row.slug);
  },

  async create(data: WalletCategoryInsert): Promise<WalletCategory> {
    const [row] = await db.insert(walletCategories).values(data).returning();
    return row;
  },

  /**
   * Inserts the built-in rows, skipping any that already exist. The unique
   * index on `slug` is what makes this safe to run on every launch.
   */
  async insertMissing(rows: WalletCategoryInsert[]): Promise<void> {
    if (rows.length === 0) return;

    await db
      .insert(walletCategories)
      .values(rows)
      .onConflictDoNothing({ target: walletCategories.slug });
  },
};
