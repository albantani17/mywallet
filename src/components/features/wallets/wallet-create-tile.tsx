import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type WalletCreateTileProps = {
  onPress: () => void;
};

/** Final cell of the grid: opens the create-wallet sheet. */
export function WalletCreateTile({ onPress }: WalletCreateTileProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-white/25 bg-white/5 p-3.5 active:opacity-70"
    >
      <View className="size-11 flex-col items-center justify-center rounded-full bg-brand-primary/25">
        <Ionicons name="add" size={24} color="#a7d9b0" />
      </View>
      <Text className="text-sm font-semibold text-white">
        {t("wallets.add")}
      </Text>
    </Pressable>
  );
}
