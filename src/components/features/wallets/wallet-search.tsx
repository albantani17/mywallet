import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

type WalletSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function WalletSearch({ value, onChange }: WalletSearchProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-white/10 px-4">
      <Ionicons name="search" size={18} color="#9fb0a4" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("wallets.searchPlaceholder")}
        placeholderTextColor="#9fb0a4"
        returnKeyType="search"
        autoCorrect={false}
        className="h-12 flex-1 text-base text-white"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange("")}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color="#9fb0a4" />
        </Pressable>
      ) : null}
    </View>
  );
}
