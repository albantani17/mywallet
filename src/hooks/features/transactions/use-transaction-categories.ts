import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useTranslation } from "react-i18next";

import {
  BUILT_IN_LABEL_KEYS,
  toIconName,
} from "@/components/features/transactions/transaction-category";
import { categoryQueries } from "@/db";
import type { Category, CategoryType } from "@/db";

export type ResolvedTransactionCategory = {
  id: number;
  label: string;
  icon: ReturnType<typeof toIconName>;
  color: string;
};

/**
 * Live category list for one transaction type.
 *
 * Built-in labels come from i18n so they stay translated; a custom category
 * shows its typed name in both languages, which is unavoidable for
 * user-entered text.
 */
export function useTransactionCategories(type: CategoryType) {
  const { t } = useTranslation();
  const { data, updatedAt } = useLiveQuery(categoryQueries.listByType(type), [
    type,
  ]);

  const categories = data ?? [];

  const labelOf = (category: Category): string => {
    if (!category.isBuiltIn) return category.name;

    const key =
      BUILT_IN_LABEL_KEYS[category.slug as keyof typeof BUILT_IN_LABEL_KEYS];
    return key ? t(key) : category.name;
  };

  const resolved: ResolvedTransactionCategory[] = categories.map((category) => ({
    id: category.id,
    label: labelOf(category),
    icon: toIconName(category.icon),
    color: category.color ?? "#8a978c",
  }));

  return {
    categories,
    resolved,
    labelOf,
    // Undefined until the first query resolves — callers use it to avoid
    // treating "not loaded yet" as "no categories".
    isReady: updatedAt !== undefined,
  };
}
