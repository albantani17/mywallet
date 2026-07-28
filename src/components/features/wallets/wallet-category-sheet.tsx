import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useCreateWalletCategory } from "@/hooks/features/wallets/use-create-wallet-category";
import { cn } from "@/utils/cn";

import { COLOR_CHOICES, ICON_CHOICES, TINT_ALPHA, toIconName } from "./wallet-type";

type WalletCategorySheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WalletCategorySheet({
  isOpen,
  onClose,
}: WalletCategorySheetProps) {
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
  } = useCreateWalletCategory(onClose);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <Text className="text-xl font-bold text-brand-logo-fg">
          {t("wallets.categories.sheetTitle")}
        </Text>

        <TextField
          label={t("wallets.categories.nameLabel")}
          value={name}
          onChangeText={changeName}
          error={error}
          placeholder={t("wallets.categories.namePlaceholder")}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-brand-logo-fg">
            {t("wallets.categories.iconLabel")}
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
                    isActive ? "border-transparent" : "border-black/10 bg-white",
                  )}
                  style={
                    isActive ? { backgroundColor: color + TINT_ALPHA } : undefined
                  }
                >
                  <Ionicons
                    name={toIconName(choice)}
                    size={20}
                    color={isActive ? color : "#8a978c"}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-brand-logo-fg">
            {t("wallets.categories.colorLabel")}
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
          label={t("wallets.categories.save")}
          isLoading={isSubmitting}
          onPress={submit}
        />
      </View>
    </BottomSheet>
  );
}
