import { walletCategoryRepository } from "@/db";
import type { WalletCategory } from "@/db";

export type CreateWalletCategoryInput = {
  name: string;
  icon: string;
  color: string;
};

export type WalletCategorySeed = CreateWalletCategoryInput & {
  slug: string;
  sortOrder: number;
};

/** "My Crypto Wallet" → "my-crypto-wallet" */
function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

export const walletCategoryService = {
  /**
   * Makes sure the four built-in categories exist.
   *
   * Runs on every launch after migrations: `onConflictDoNothing` on the unique
   * slug makes it a no-op once they are there, and it also backfills a device
   * that upgraded from before this table existed.
   */
  async ensureBuiltIns(seeds: WalletCategorySeed[]): Promise<void> {
    await walletCategoryRepository.insertMissing(
      seeds.map((seed) => ({
        slug: seed.slug,
        name: seed.name,
        icon: seed.icon,
        color: seed.color,
        isBuiltIn: true,
        sortOrder: seed.sortOrder,
      })),
    );
  },

  /**
   * Creates a custom category, deriving a unique slug from the name. Two
   * categories may share a display name; the slug gets a numeric suffix so the
   * unique index is never violated.
   */
  async createCategory(
    input: CreateWalletCategoryInput,
  ): Promise<WalletCategory> {
    const base = slugify(input.name);

    // One round trip: ask for the base plus a handful of suffixed candidates
    // and take the first that is free.
    const candidates = [base, ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`)];
    const taken = new Set(
      await walletCategoryRepository.findExistingSlugs(candidates),
    );
    const slug =
      candidates.find((candidate) => !taken.has(candidate)) ??
      `${base}-${Date.now()}`;

    const existing = await walletCategoryRepository.list();

    return walletCategoryRepository.create({
      slug,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      isBuiltIn: false,
      sortOrder: existing.length,
    });
  },
};
