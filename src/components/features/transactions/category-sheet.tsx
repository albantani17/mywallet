import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { CategoryType } from "@/db";
import { useCreateTransactionCategory } from "@/hooks/features/transactions/use-create-transaction-category";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

import {
  COLOR_CHOICES,
  ICON_CHOICES,
  TINT_ALPHA,
  toIconName,
} from "./transaction-category";

type CategorySheetProps = {
  isOpen: boolean;
  /** The transaction type the new category belongs to. */
  type: CategoryType;
  onClose: () => void;
  /** Called with the new id so the form can select it immediately. */
  onCreated: (categoryId: number) => void;
};

/** Name, icon and colour for a new transaction category. */
export function CategorySheet({
  isOpen,
  type,
  onClose,
  onCreated,
}: CategorySheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const {
    name,
    icon,
    color,
    error,
    isSubmitting,
    changeName,
    changeIcon,
    changeColor,
    submit,
  } = useCreateTransactionCategory(type, onCreated);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <Text className="text-xl font-bold text-fg">
          {t("newTransaction.categorySheet.title")}
        </Text>

        <TextField
          label={t("newTransaction.categorySheet.nameLabel")}
          value={name}
          onChangeText={changeName}
          error={error}
          placeholder={t("newTransaction.categorySheet.namePlaceholder")}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-fg">
            {t("newTransaction.categorySheet.iconLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ICON_CHOICES.map((choice) => {
              const isActive = choice === icon;
              return (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => changeIcon(choice)}
                  className={cn(
                    "size-11 flex-col items-center justify-center rounded-2xl border",
                    isActive ? "border-transparent" : "border-line bg-elevated",
                  )}
                  style={
                    isActive ? { backgroundColor: color + TINT_ALPHA } : undefined
                  }
                >
                  <Ionicons
                    name={toIconName(choice)}
                    size={20}
                    color={isActive ? color : colors.fgMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-fg">
            {t("newTransaction.categorySheet.colorLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {COLOR_CHOICES.map((choice) => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                accessibilityState={{ selected: choice === color }}
                onPress={() => changeColor(choice)}
                className="size-9 flex-col items-center justify-center rounded-full"
                style={{ backgroundColor: choice }}
              >
                {choice === color ? (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          label={t("newTransaction.categorySheet.save")}
          isLoading={isSubmitting}
          onPress={submit}
        />
      </View>
    </BottomSheet>
  );
}
