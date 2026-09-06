import { BUILT_IN_TRANSACTION_CATEGORY_SEEDS } from "@/components/features/transactions/transaction-category";
import { BUILT_IN_CATEGORY_SEEDS } from "@/components/features/wallets/wallet-type";

import { categoryService } from "./category-service";
import { debtPresetService } from "./debt-preset-service";
import { walletCategoryService } from "./wallet-category-service";

export const seedService = {
  /**
   * Inserts the built-in wallet categories, transaction categories and debt
   * presets. Idempotent — each seeder relies on a unique `slug` index and
   * `onConflictDoNothing` — so this is safe to run on every launch, which is
   * also what backfills a device that upgraded from before those rows existed.
   *
   * Called twice: once at startup from the root layout, and again after a
   * restore, since a backup taken on an older build may predate a built-in
   * that has since been added.
   *
   * A failure must not block the caller. The category resolvers fall back to a
   * generic icon, and the three seeds are independent enough that one failing
   * should not discard the others — so each settles on its own.
   */
  async ensureBuiltIns(): Promise<void> {
    await Promise.all([
      walletCategoryService
        .ensureBuiltIns(BUILT_IN_CATEGORY_SEEDS)
        .catch((e) => console.error("Failed to seed wallet categories", e)),
      categoryService
        .ensureBuiltIns(BUILT_IN_TRANSACTION_CATEGORY_SEEDS)
        .catch((e) => console.error("Failed to seed transaction categories", e)),
      debtPresetService
        .ensureBuiltIns()
        .catch((e) => console.error("Failed to seed debt presets", e)),
    ]);
  },
};
