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
import { formatDate, formatMonthShort } from "@/utils/format-date";

type MonthSummaryCardProps = { insights: Insights };

/**
 * What has been spent this month, how fast, and where that lands.
 *
 * The comparison is labelled with the day it runs to, because it compares the
 * same slice of both months — without the label a reader assumes it is being
 * measured against last month's full total.
 */
export function MonthSummaryCard({ insights }: MonthSummaryCardProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const money = (value: number) => formatCurrency(value, locale);
  const { comparison, hasBaseline } = insights;

  const isUp = comparison.direction === "up";
  const percent =
    comparison.ratio === null
      ? null
      : Math.round(Math.abs(comparison.ratio) * 100);

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-fg">
          {t("insights.monthTitle")}
        </Text>
        <Text className="text-[11px] text-fg-muted">
          {t("insights.asOf", { date: formatDate(insights.now, locale) })}
        </Text>
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <Text className="flex-1 text-2xl font-extrabold text-fg" adjustsFontSizeToFit>
          {money(insights.thisMonth.expense)}
        </Text>

        {/* Hidden rather than shown as "+100%": the first month of use has
            nothing to compare with, and a made-up baseline is worse than none. */}
        {hasBaseline && percent !== null ? (
          <View className="flex-row items-center gap-1 rounded-full bg-elevated px-2 py-1">
            <Ionicons
              name={isUp ? "arrow-up" : "arrow-down"}
              size={12}
              color={isUp ? colors.danger : colors.primary}
            />
            <Text className="text-[11px] font-semibold text-fg-muted">
              {percent}%{" "}
              {t("insights.vsMonth", {
                month: formatMonthShort(insights.previousMonthDate, locale),
              })}
            </Text>
          </View>
        ) : (
          <Text className="text-[11px] text-fg-muted">
            {t("insights.noComparison")}
          </Text>
        )}
      </View>

      <View className="h-px bg-line" />

      <Text className="text-xs text-fg-muted">
        {t("insights.dailyAverage", { amount: money(insights.dailyAverage) })}
        {" · "}
        {t("insights.projected", {
          amount: formatCompactCurrency(insights.projected, locale),
        })}
      </Text>
    </View>
  );
}
