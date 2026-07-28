import { categoryRepository } from "@/db";
import type { Category, CategoryType } from "@/db";

export type CreateCategoryInput = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

export type CategorySeed = {
  slug: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

/** "Makanan & Minuman" → "makanan-minuman" */
function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

export const categoryService = {
  /**
   * Makes sure the built-in transaction categories exist.
   *
   * Runs on every launch after migrations: `onConflictDoNothing` on the unique
   * slug makes it a no-op once they are there, and it also backfills a device
   * that upgraded from before the slug column existed.
   *
   * `sortOrder` comes from the seed's position, so the pickers render them in
   * the order they are written rather than alphabetically.
   */
  async ensureBuiltIns(seeds: CategorySeed[]): Promise<void> {
    await categoryRepository.insertMissing(
      seeds.map((seed, index) => ({
        slug: seed.slug,
        name: seed.name,
        type: seed.type,
        icon: seed.icon,
        color: seed.color,
        isBuiltIn: true,
        sortOrder: index,
      })),
    );
  },

  /**
   * Creates a custom category, deriving a unique slug from the name. Two
   * categories may share a display name; the slug gets a numeric suffix so the
   * unique index is never violated.
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const base = slugify(input.name);

    // One round trip: ask for the base plus a handful of suffixed candidates
    // and take the first that is free.
    const candidates = [
      base,
      ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`),
    ];
    const taken = new Set(await categoryRepository.findExistingSlugs(candidates));
    const slug =
      candidates.find((candidate) => !taken.has(candidate)) ??
      `${base}-${Date.now()}`;

    // Pushes the new row past every existing one of its type.
    const existing = await categoryRepository.listByType(input.type);

    return categoryRepository.create({
      slug,
      name: input.name.trim(),
      type: input.type,
      icon: input.icon,
      color: input.color,
      isBuiltIn: false,
      sortOrder: existing.length + 1000,
    });
  },
};
