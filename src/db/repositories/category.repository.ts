import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "../client";
import type { CategoryType } from "../schema/categories";
import { categories } from "../schema/categories";
import type {
  Category,
  CategoryInsert,
  CategoryTreeNode,
  CategoryUpdate,
} from "../validators/category.validator";

/**
 * Select builders for useLiveQuery, which needs the builder itself rather than
 * the promise the repository methods return. Ordered by sortOrder so the seeded
 * built-ins keep the sequence they were written in and user categories land at
 * the end.
 */
export const categoryQueries = {
  list: () =>
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id)),

  listByType: (type: CategoryType) =>
    db
      .select()
      .from(categories)
      .where(eq(categories.type, type))
      .orderBy(asc(categories.sortOrder), asc(categories.id)),
};

export const categoryRepository = {
  async list(): Promise<Category[]> {
    return categoryQueries.list();
  },

  async listByType(type: CategoryType): Promise<Category[]> {
    return categoryQueries.listByType(type);
  },

  /** Which of the given slugs already exist — used to make a slug unique. */
  async findExistingSlugs(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) return [];

    const rows = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(inArray(categories.slug, slugs));

    return rows.map((row) => row.slug);
  },

  /** Top-level categories only — the usual first step of a category picker. */
  async listRoots(type?: CategoryType): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(
        type
          ? and(isNull(categories.parentId), eq(categories.type, type))
          : isNull(categories.parentId),
      )
      .orderBy(asc(categories.name));
  },

  /**
   * Roots with their children attached. Built from one flat read rather than a
   * query per parent, since the tree is only two levels deep.
   */
  async getTree(type?: CategoryType): Promise<CategoryTreeNode[]> {
    const rows = type
      ? await categoryRepository.listByType(type)
      : await categoryRepository.list();

    const roots = rows
      .filter((row) => row.parentId === null)
      .map((row) => ({ ...row, children: [] as Category[] }));
    const byId = new Map(roots.map((root) => [root.id, root]));

    for (const row of rows) {
      if (row.parentId === null) continue;
      byId.get(row.parentId)?.children.push(row);
    }

    return roots;
  },

  async getById(id: number): Promise<Category | null> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * The built-in row a slug names, or null before the seeder has run.
   *
   * Callers that tag a transaction automatically use this — a missing row must
   * degrade to an uncategorised transaction, never to a failed write.
   */
  async getBySlug(slug: string): Promise<Category | null> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  },

  async create(data: CategoryInsert): Promise<Category> {
    const [row] = await db.insert(categories).values(data).returning();
    return row;
  },

  /**
   * Inserts the built-in rows, skipping any that already exist. The unique
   * index on `slug` is what makes this safe to run on every launch.
   */
  async insertMissing(rows: CategoryInsert[]): Promise<void> {
    if (rows.length === 0) return;

    await db
      .insert(categories)
      .values(rows)
      .onConflictDoNothing({ target: categories.slug });
  },

  async update(id: number, data: CategoryUpdate): Promise<Category | null> {
    const [row] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Fails while transactions or child categories still reference the row —
   * foreign keys are enforced (see client.ts).
   */
  async remove(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  },
};
