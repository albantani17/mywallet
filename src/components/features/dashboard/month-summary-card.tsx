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
import { formatDateRange, formatMonthShort } from "@/utils/format-date";

type MonthSummaryCardProps = { insights: Insights };

/**
 * What has been spent in the period, how fast, and where that lands.
 *
 * The card is labelled with the dates it covers, because a running period is
 * compared with the same slice of the one before — without the label a reader
 * assumes it is being measured against last month's full total.
 */
export function MonthSummaryCard({ insights }: MonthSummaryCardProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const money = (value: number) => formatCurrency(value, locale);
  const { comparison, hasBaseline, resolved, period } = insights;

  // A one-month period names the month it is compared with; anything longer
  // compares with "the period before", which a single month name would misstate.
  const versus =
    period === "thisMonth" || period === "lastMonth"
      ? t("insights.vsMonth", {
          month: formatMonthShort(resolved.previous.from, locale),
        })
      : t("insights.vsPrevious");

  const isUp = comparison.direction === "up";
  const percent =
    comparison.ratio === null
      ? null
      : Math.round(Math.abs(comparison.ratio) * 100);

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-fg">
          {t("insights.spentTitle")}
        </Text>
        <Text className="text-[11px] text-fg-muted">
          {formatDateRange(resolved.from, resolved.to, locale)}
        </Text>
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <Text className="flex-1 text-2xl font-extrabold text-fg" adjustsFontSizeToFit>
          {money(insights.totals.expense)}
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
              {percent}% {versus}
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
        {insights.projected === null
          ? null
          : ` · ${t("insights.projected", {
              amount: formatCompactCurrency(insights.projected, locale),
            })}`}
      </Text>
    </View>
  );
}
