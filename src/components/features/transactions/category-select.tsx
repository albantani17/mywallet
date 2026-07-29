import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { SelectField } from "@/components/ui/select-field";
import type { CategoryType } from "@/db";
import { useTransactionCategories } from "@/hooks/features/transactions/use-transaction-categories";

import { CategorySelectSheet } from "./category-select-sheet";
import { TINT_ALPHA } from "./transaction-category";

type CategorySelectProps = {
  type: CategoryType;
  value: number | null;
  onChange: (categoryId: number) => void;
  error?: string | null;
};

/** The chosen category as a field, opening the picker sheet on press. */
export function CategorySelect({
  type,
  value,
  onChange,
  error,
}: CategorySelectProps) {
  const { t } = useTranslation();
  const { resolved } = useTransactionCategories(type);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selected = resolved.find((category) => category.id === value);

  return (
    <>
      <SelectField
        label={t("newTransaction.categoryLabel")}
        placeholder={t("newTransaction.categoryPlaceholder")}
        error={error}
        onPress={() => setIsSheetOpen(true)}
      >
        {selected ? (
          <View className="flex-1 flex-row items-center gap-2">
            <View
              className="size-7 flex-col items-center justify-center rounded-full"
              style={{ backgroundColor: selected.color + TINT_ALPHA }}
            >
              <Ionicons
                name={selected.icon}
                size={15}
                color={selected.color}
              />
            </View>
            <Text className="flex-1 text-base text-fg" numberOfLines={1}>
              {selected.label}
            </Text>
          </View>
        ) : undefined}
      </SelectField>

      <CategorySelectSheet
        isOpen={isSheetOpen}
        type={type}
        value={value}
        onClose={() => setIsSheetOpen(false)}
        onSelect={onChange}
      />
    </>
  );
}
