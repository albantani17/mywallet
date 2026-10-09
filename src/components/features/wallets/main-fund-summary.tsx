import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useMainFunds } from "@/hooks/features/wallets/use-main-funds";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";

type MainFundSummaryProps = { onPress: () => void };

/** "Main funds · 3 of 5 wallets" under the total — the way into the list. */
export function MainFundSummary({ onPress }: MainFundSummaryProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();
  const { wallets, mainCount, mainTotal } = useMainFunds();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-surface px-5 py-3 active:opacity-70"
    >
      <Ionicons name="star-outline" size={16} color={colors.primary} />

      <View className="flex-1 flex-col">
        <Text className="text-sm font-semibold text-fg">
          {t("wallets.mainFund.title")}
        </Text>
        <Text className="text-[11px] text-fg-muted">
          {t("wallets.mainFund.count", {
            count: mainCount,
            total: wallets.length,
          })}
        </Text>
      </View>

      <Text className="text-sm font-bold text-fg" numberOfLines={1}>
        {formatCurrency(mainTotal, locale)}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.fgMuted} />
    </Pressable>
  );
}
