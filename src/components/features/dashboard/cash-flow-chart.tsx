import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { Insights } from "@/hooks/features/dashboard/use-insights";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { AppLocale } from "@/i18n";
import type { Granularity, SeriesBucket } from "@/services/insight";
import { formatCompactCurrency } from "@/utils/format-currency";
import {
  formatDate,
  formatDateRange,
  formatDayMonth,
  formatMonthShort,
  formatMonthYear,
} from "@/utils/format-date";

type CashFlowChartProps = { insights: Insights };

/** Tallest bar in the chart, in points. */
const CHART_HEIGHT = 72;

/** Roughly how many axis labels fit across the card without colliding. */
const MAX_LABELS = 6;

/** Room for the widest label, "12 Agu". */
const LABEL_WIDTH = 44;

/** Bars thin out as the series grows, so a 31-day month still fits the card. */
function barWidthFor(count: number): number {
  if (count > 24) return 3;
  if (count > 12) return 5;
  return 8;
}

function axisLabel(
  bucket: SeriesBucket,
  granularity: Granularity,
  locale: AppLocale,
): string {
  if (granularity === "day") return String(bucket.date.getDate());
  if (granularity === "week") return formatDayMonth(bucket.date, locale);
  return formatMonthShort(bucket.date, locale);
}

/** The selected bar spelled out in full, under the chart. */
function bucketTitle(
  bucket: SeriesBucket,
  granularity: Granularity,
  locale: AppLocale,
): string {
  if (granularity === "day") return formatDate(bucket.date, locale);
  if (granularity === "week") {
    return formatDateRange(bucket.date, bucket.end, locale);
  }
  return formatMonthYear(bucket.date, locale);
}

/**
 * Money in and out across the picked period, a bar per day, week or month,
 * with the selected bar's figures spelled out underneath.
 *
 * Bars are plain Views: a chart this small does not justify pulling in
 * react-native-svg, which would also force a native rebuild of the dev client.
 * Heights and widths are inline styles for the reason given in progress-bar.tsx
 * — Uniwind cannot see a class that was computed at runtime.
 *
 * Debt cash flow gets its own line rather than being folded into income and
 * expense: a loan is neither, but hiding it entirely would leave a period's
 * balance moving for no visible reason.
 *
 * The section keys this component by period, so picking another period starts
 * the selection over on its newest bar.
 */
export function CashFlowChart({ insights }: CashFlowChartProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const { buckets, max, granularity } = insights.series;
  const [selected, setSelected] = useState(buckets.length - 1);

  const active = buckets[Math.min(selected, buckets.length - 1)];
  const money = (value: number) => formatCompactCurrency(value, locale);
  const heightOf = (value: number) =>
    max > 0 ? Math.max((value / max) * CHART_HEIGHT, value > 0 ? 3 : 0) : 0;

  const barWidth = barWidthFor(buckets.length);
  const labelEvery = Math.ceil(buckets.length / MAX_LABELS);
  // Count back from the newest bar, so the latest one is always labelled.
  const showsLabel = (index: number) =>
    (buckets.length - 1 - index) % labelEvery === 0;

  const debtFlow = active ? active.debtIn - active.debtOut : 0;

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-fg">
          {t("insights.cashFlowTitle")}
        </Text>

        <View className="flex-row items-center gap-3">
          <Legend color={colors.primary} label={t("insights.income")} />
          <Legend color={colors.danger} label={t("insights.expense")} />
        </View>
      </View>

      <View className="flex-row items-end justify-between" style={{ height: CHART_HEIGHT }}>
        {buckets.map((bucket, index) => (
          <Pressable
            key={bucket.key}
            accessibilityRole="button"
            accessibilityLabel={bucketTitle(bucket, granularity, locale)}
            accessibilityState={{ selected: index === selected }}
            onPress={() => setSelected(index)}
            className="flex-1 flex-col justify-end active:opacity-70"
            style={{ height: CHART_HEIGHT }}
          >
            <View className="flex-row items-end justify-center gap-px">
              <View
                className="rounded-t-sm"
                style={{
                  width: barWidth,
                  height: heightOf(bucket.income),
                  backgroundColor: colors.primary,
                  opacity: index === selected ? 1 : 0.45,
                }}
              />
              <View
                className="rounded-t-sm"
                style={{
                  width: barWidth,
                  height: heightOf(bucket.expense),
                  backgroundColor: colors.danger,
                  opacity: index === selected ? 1 : 0.45,
                }}
              />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Labels are centred under their bar by position rather than sharing
          the bar's slot: with 31 bars a slot is narrower than "5 Agu". */}
      <View style={{ height: 14 }}>
        {buckets.map((bucket, index) =>
          showsLabel(index) ? (
            <Text
              key={bucket.key}
              numberOfLines={1}
              className={
                index === selected
                  ? "absolute text-center text-[10px] font-bold text-fg"
                  : "absolute text-center text-[10px] text-fg-muted"
              }
              style={{
                left: `${((index + 0.5) / buckets.length) * 100}%`,
                width: LABEL_WIDTH,
                marginLeft: -LABEL_WIDTH / 2,
              }}
            >
              {axisLabel(bucket, granularity, locale)}
            </Text>
          ) : null,
        )}
      </View>

      {active ? (
        <View className="flex-col gap-1 rounded-2xl bg-elevated p-3">
          <Text className="text-[11px] font-semibold text-fg">
            {bucketTitle(active, granularity, locale)}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] text-fg-muted">
              {t("insights.income")} {money(active.income)}
              {" · "}
              {t("insights.expense")} {money(active.expense)}
            </Text>
            <Text
              className={
                active.net >= 0
                  ? "text-xs font-bold text-primary"
                  : "text-xs font-bold text-danger"
              }
            >
              {t("insights.net", { amount: money(active.net) })}
            </Text>
          </View>

          {debtFlow !== 0 ? (
            <Text className="text-[11px] text-fg-muted">
              {t("insights.debtCashFlow", { amount: money(debtFlow) })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[10px] text-fg-muted">{label}</Text>
    </View>
  );
}
