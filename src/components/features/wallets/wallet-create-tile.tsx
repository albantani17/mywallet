import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type WalletCreateTileProps = {
  onPress: () => void;
};

/** Final cell of the grid: opens the create-wallet sheet. */
export function WalletCreateTile({ onPress }: WalletCreateTileProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-line bg-surface p-3.5 active:opacity-70"
    >
      <View className="size-11 flex-col items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name="add" size={24} color={colors.primary} />
      </View>
      <Text className="text-sm font-semibold text-fg">
        {t("wallets.add")}
      </Text>
    </Pressable>
  );
}
