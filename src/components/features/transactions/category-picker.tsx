import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { CategoryType } from "@/db";
import { useTransactionCategories } from "@/hooks/features/transactions/use-transaction-categories";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { CategorySheet } from "./category-sheet";
import { TINT_ALPHA } from "./transaction-category";

type CategoryPickerProps = {
  type: CategoryType;
  value: number | null;
  onChange: (categoryId: number) => void;
  error?: string | null;
};

/**
 * Wrapping grid of the categories for one transaction type, with an "add"
 * tile last. Creating a category from here selects it straight away, so the
 * user is not sent back to hunt for what they just made.
 */
export function CategoryPicker({
  type,
  value,
  onChange,
  error,
}: CategoryPickerProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { resolved } = useTransactionCategories(type);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCreated = (categoryId: number) => {
    setIsSheetOpen(false);
    onChange(categoryId);
  };

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-sm font-medium text-fg">
        {t("newTransaction.categoryLabel")}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {resolved.map((category) => {
          const isActive = category.id === value;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(category.id)}
              className={cn(
                "flex-row items-center gap-1.5 rounded-2xl border px-3 py-2",
                isActive
                  ? "border-primary bg-primary-soft"
                  : "border-line bg-elevated",
              )}
            >
              <View
                className="size-6 flex-col items-center justify-center rounded-lg"
                style={{ backgroundColor: category.color + TINT_ALPHA }}
              >
                <Ionicons
                  name={category.icon}
                  size={13}
                  color={category.color}
                />
              </View>
              <Text className="text-xs font-semibold text-fg">
                {category.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("newTransaction.categorySheet.add")}
          onPress={() => setIsSheetOpen(true)}
          className="flex-row items-center gap-1.5 rounded-2xl border border-dashed border-primary px-3 py-2 active:opacity-70"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text className="text-xs font-semibold text-primary">
            {t("newTransaction.categorySheet.add")}
          </Text>
        </Pressable>
      </View>

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}

      <CategorySheet
        isOpen={isSheetOpen}
        type={type}
        onClose={() => setIsSheetOpen(false)}
        onCreated={handleCreated}
      />
    </View>
  );
}
