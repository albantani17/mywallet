import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SearchField } from "@/components/ui/search-field";
import type { CategoryType } from "@/db";
import { useTransactionCategories } from "@/hooks/features/transactions/use-transaction-categories";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "@/utils/cn";

import { CategoryCreateForm } from "./category-create-form";
import { TINT_ALPHA } from "./transaction-category";

type CategorySelectSheetProps = {
  isOpen: boolean;
  type: CategoryType;
  value: number | null;
  onClose: () => void;
  onSelect: (categoryId: number) => void;
};

/**
 * Category picker: search, then "new category", then the list.
 *
 * Two modes in one sheet rather than two stacked sheets — an RN Modal inside
 * another Modal is fragile on Android, and switching modes keeps the keyboard
 * and the sheet height stable.
 *
 * Search sits above the add row so the common path (find an existing category)
 * is the first thing under your thumb, and the add row stays put instead of
 * being pushed around by the filtered list.
 */
export function CategorySelectSheet({
  isOpen,
  type,
  value,
  onClose,
  onSelect,
}: CategorySelectSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { resolved } = useTransactionCategories(type);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? resolved.filter((category) =>
        category.label.toLowerCase().includes(needle),
      )
    : resolved;

  // Leaving the sheet resets it, so it never reopens mid-search or mid-create.
  const close = () => {
    setQuery("");
    setIsCreating(false);
    onClose();
  };

  const handleCreated = (categoryId: number) => {
    setQuery("");
    setIsCreating(false);
    onSelect(categoryId);
    onClose();
  };

  const handleSelect = (categoryId: number) => {
    setQuery("");
    onSelect(categoryId);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={close}>
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-2">
          {isCreating ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("newTransaction.categorySheet.back")}
              onPress={() => setIsCreating(false)}
              hitSlop={8}
              className="size-8 flex-col items-center justify-center rounded-full bg-elevated active:opacity-70"
            >
              <Ionicons name="arrow-back" size={18} color={colors.fg} />
            </Pressable>
          ) : null}
          <Text className="flex-1 text-xl font-bold text-fg">
            {isCreating
              ? t("newTransaction.categorySheet.title")
              : t("newTransaction.categorySheet.selectTitle")}
          </Text>
        </View>

        {isCreating ? (
          <CategoryCreateForm type={type} onCreated={handleCreated} />
        ) : (
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={t("newTransaction.categorySheet.searchPlaceholder")}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsCreating(true)}
              className="flex-row items-center gap-3 rounded-2xl border border-dashed border-primary px-4 py-3 active:opacity-70"
            >
              <View className="size-8 flex-col items-center justify-center rounded-full bg-primary-soft">
                <Ionicons name="add" size={18} color={colors.primary} />
              </View>
              <Text className="text-sm font-semibold text-primary">
                {t("newTransaction.categorySheet.add")}
              </Text>
            </Pressable>

            <View className="flex-col">
              {matches.length === 0 ? (
                <Text className="py-6 text-center text-sm text-fg-muted">
                  {t("newTransaction.categorySheet.noResults")}
                </Text>
              ) : (
                matches.map((category) => {
                  const isSelected = category.id === value;
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelect(category.id)}
                      className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-elevated"
                    >
                      <View
                        className="size-9 flex-col items-center justify-center rounded-full"
                        style={{ backgroundColor: category.color + TINT_ALPHA }}
                      >
                        <Ionicons
                          name={category.icon}
                          size={18}
                          color={category.color}
                        />
                      </View>
                      <Text
                        className={cn(
                          "flex-1 text-base",
                          isSelected
                            ? "font-semibold text-primary"
                            : "text-fg",
                        )}
                      >
                        {category.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </>
        )}
      </View>
    </BottomSheet>
  );
}
