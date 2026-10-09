import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { Insights } from "@/hooks/features/dashboard/use-insights";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  formatCompactCurrency,
  formatCurrency,
} from "@/utils/format-currency";

type DailyAllowanceCardProps = { insights: Insights };

/**
 * How much can be spent per day until the month ends, set against what is
 * actually being spent per day.
 *
 * Worked out from the main funds only, so savings parked in another wallet do
 * not make the allowance look roomier than the money the user means to spend.
 * Always this month, whatever period the cards below are showing.
 */
export function DailyAllowanceCard({ insights }: DailyAllowanceCardProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const { allowance, average, daysLeft, projectedBalance, status } =
    insights.allowance;
  const isOver = status !== "onTrack";

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-fg">
          {t("insights.allowance.title")}
        </Text>
        <Text className="text-[11px] text-fg-muted">
          {t("insights.allowance.daysLeft", { count: daysLeft })}
        </Text>
      </View>

      <View className="flex-row items-end gap-1">
        <Text
          className="text-2xl font-extrabold text-fg"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatCurrency(allowance, locale)}
        </Text>
        <Text className="pb-1 text-xs text-fg-muted">
          {t("insights.allowance.perDay")}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 rounded-2xl bg-elevated p-3">
        <Ionicons
          name={isOver ? "alert-circle-outline" : "checkmark-circle-outline"}
          size={18}
          color={isOver ? colors.danger : colors.primary}
        />
        <Text className="flex-1 text-xs leading-4 text-fg">
          {status === "empty"
            ? t("insights.allowance.empty")
            : t(
                isOver
                  ? "insights.allowance.over"
                  : "insights.allowance.onTrack",
                { amount: formatCurrency(average, locale) },
              )}
        </Text>
      </View>

      {status === "empty" ? null : (
        <Text className="text-xs text-fg-muted">
          {t("insights.allowance.projected", {
            amount: formatCompactCurrency(projectedBalance, locale),
          })}
        </Text>
      )}
    </View>
  );
}
