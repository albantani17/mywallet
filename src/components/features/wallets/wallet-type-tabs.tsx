import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useWalletCategories } from "@/hooks/features/wallets/use-wallet-categories";
import type { WalletFilter } from "@/hooks/features/wallets/use-wallet-filters";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

type WalletTypeTabsProps = {
  value: WalletFilter;
  onChange: (filter: WalletFilter) => void;
  onAddCategory: () => void;
};

/**
 * "Semua" plus one chip per category, with the add button pinned outside the
 * ScrollView. The chips already overflow at four categories, so a button
 * inside the scroll area would only be reachable after scrolling to the end.
 */
export function WalletTypeTabs({
  value,
  onChange,
  onAddCategory,
}: WalletTypeTabsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { categories, labelOf } = useWalletCategories();

  const tabs: { key: WalletFilter; label: string }[] = [
    { key: "all", label: t("wallets.filterAll") },
    ...categories.map((category) => ({
      key: category.slug as WalletFilter,
      label: labelOf(category),
    })),
  ];

  return (
    <View className="flex-row items-center gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="flex-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(tab.key)}
              className={cn(
                "flex-row items-center self-start rounded-full border px-3 py-1.5",
                isActive
                  ? "border-primary bg-primary"
                  : "border-line bg-surface",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-fg" : "text-fg-muted",
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("wallets.categories.add")}
        onPress={onAddCategory}
        hitSlop={8}
        className="size-8 flex-col items-center justify-center rounded-full border border-line bg-surface active:opacity-70"
      >
        <Ionicons name="add" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}
