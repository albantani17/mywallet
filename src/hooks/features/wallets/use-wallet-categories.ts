import { useTranslation } from "react-i18next";

import { schema, walletCategoryQueries } from "@/db";
import type { WalletCategory } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import {
  FALLBACK_COLOR,
  FALLBACK_ICON,
  toIconName,
} from "@/components/features/wallets/wallet-type";

/**
 * Explicit map rather than a `wallets.types.${slug}` template: now that a slug
 * is any string, the template no longer satisfies the typed i18n keys. This
 * also means an unrecognised built-in falls back to its stored name instead of
 * rendering a raw key.
 */
const BUILT_IN_LABEL_KEYS = {
  cash: "wallets.types.cash",
  bank: "wallets.types.bank",
  ewallet: "wallets.types.ewallet",
  investment: "wallets.types.investment",
} as const;

export type ResolvedCategory = {
  label: string;
  icon: ReturnType<typeof toIconName>;
  color: string;
};

/**
 * Live category list plus a slug resolver for rendering a wallet.
 *
 * Built-in labels come from i18n so they stay translated; a custom category
 * shows its typed name in both languages, which is unavoidable for
 * user-entered text.
 */
export function useWalletCategories() {
  const { t } = useTranslation();
  const { data, updatedAt } = useLiveData(walletCategoryQueries.list(), [
    schema.walletCategories,
  ]);

  const categories = data ?? [];
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  const labelOf = (category: WalletCategory): string => {
    if (!category.isBuiltIn) return category.name;

    const key =
      BUILT_IN_LABEL_KEYS[category.slug as keyof typeof BUILT_IN_LABEL_KEYS];
    return key ? t(key) : category.name;
  };

  /** Falls back to a generic glyph when the slug has no row. */
  const resolve = (slug: string): ResolvedCategory => {
    const category = bySlug.get(slug);
    if (!category) {
      return { label: slug, icon: FALLBACK_ICON, color: FALLBACK_COLOR };
    }

    return {
      label: labelOf(category),
      icon: toIconName(category.icon),
      color: category.color,
    };
  };

  return {
    categories,
    bySlug,
    labelOf,
    resolve,
    isReady: updatedAt !== undefined,
  };
}
