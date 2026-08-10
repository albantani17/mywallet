import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { categoryQueries, schema } from "@/db";
import type { Category } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { BUILT_IN_LABEL_KEYS, toIconName } from "./transaction-category";

type CategoryFilterChipProps = {
  categoryId: number;
  onClear: () => void;
};

/**
 * The category the list was opened with, and the way back out of it.
 *
 * Arriving from an insight card leaves the list narrowed by something none of
 * the visible controls mention; without this chip the user is stuck wondering
 * where their transactions went.
 */
export function CategoryFilterChip({
  categoryId,
  onClear,
}: CategoryFilterChipProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const { data } = useLiveData(categoryQueries.list(), [schema.categories]);
  const category = ((data ?? []) as Category[]).find(
    (row) => row.id === categoryId,
  );

  if (!category) return null;

  const key =
    BUILT_IN_LABEL_KEYS[category.slug as keyof typeof BUILT_IN_LABEL_KEYS];
  const label = category.isBuiltIn && key ? t(key) : category.name;

  return (
    <View className="flex-row">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("transactions.filters.clearCategory")}
        onPress={onClear}
        className="flex-row items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 active:opacity-70"
      >
        <Ionicons
          name={toIconName(category.icon)}
          size={14}
          color={category.color ?? colors.primary}
        />
        <Text className="text-xs font-semibold text-fg">{label}</Text>
        <Ionicons name="close" size={14} color={colors.fgMuted} />
      </Pressable>
    </View>
  );
}
