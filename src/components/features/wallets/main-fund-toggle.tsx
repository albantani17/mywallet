import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type MainFundToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

/** The "count this wallet in insights" checkbox on the wallet edit sheet. */
export function MainFundToggle({ value, onChange }: MainFundToggleProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className="flex-row items-center gap-3 rounded-2xl bg-elevated p-3 active:opacity-70"
    >
      <View className="flex-1 flex-col gap-0.5">
        <Text className="text-sm font-medium text-fg">
          {t("wallets.mainFund.toggleLabel")}
        </Text>
        <Text className="text-xs leading-4 text-fg-muted">
          {t("wallets.mainFund.toggleHint")}
        </Text>
      </View>

      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={22}
        color={value ? colors.primary : colors.fgMuted}
      />
    </Pressable>
  );
}
