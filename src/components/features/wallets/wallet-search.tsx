import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type WalletSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function WalletSearch({ value, onChange }: WalletSearchProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-surface px-4">
      <Ionicons name="search" size={18} color={colors.fgMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("wallets.searchPlaceholder")}
        placeholderTextColorClassName="text-fg-muted"
        returnKeyType="search"
        autoCorrect={false}
        className="h-12 flex-1 text-base text-fg"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange("")}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.fgMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
