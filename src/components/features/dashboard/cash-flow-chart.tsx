import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { Insights } from "@/hooks/features/dashboard/use-insights";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCompactCurrency } from "@/utils/format-currency";
import { formatMonthShort } from "@/utils/format-date";

type CashFlowChartProps = { insights: Insights };

/** Tallest bar in the chart, in points. */
const CHART_HEIGHT = 72;

/**
 * Six months of money in and out, with the selected month's figures spelled out
 * underneath.
 *
 * Bars are plain Views: a chart this small does not justify pulling in
 * react-native-svg, which would also force a native rebuild of the dev client.
 * Heights are inline styles for the reason given in progress-bar.tsx — Uniwind
 * cannot see a class that was computed at runtime.
 *
 * Debt cash flow gets its own line rather than being folded into income and
 * expense: a loan is neither, but hiding it entirely would leave a month's
 * balance moving for no visible reason.
 */
export function CashFlowChart({ insights }: CashFlowChartProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const { buckets, max } = insights.series;
  const [selected, setSelected] = useState(buckets.length - 1);

  const active = buckets[Math.min(selected, buckets.length - 1)];
  const money = (value: number) => formatCompactCurrency(value, locale);
  const heightOf = (value: number) =>
    max > 0 ? Math.max((value / max) * CHART_HEIGHT, value > 0 ? 3 : 0) : 0;

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

      <View className="flex-row items-end justify-between gap-1" style={{ height: CHART_HEIGHT }}>
        {buckets.map((bucket, index) => (
          <Pressable
            key={bucket.month}
            accessibilityRole="button"
            accessibilityState={{ selected: index === selected }}
            onPress={() => setSelected(index)}
            className="flex-1 flex-col justify-end active:opacity-70"
            style={{ height: CHART_HEIGHT }}
          >
            <View className="flex-row items-end justify-center gap-0.5">
              <View
                className="w-2 rounded-t-sm"
                style={{
                  height: heightOf(bucket.income),
                  backgroundColor: colors.primary,
                  opacity: index === selected ? 1 : 0.45,
                }}
              />
              <View
                className="w-2 rounded-t-sm"
                style={{
                  height: heightOf(bucket.expense),
                  backgroundColor: colors.danger,
                  opacity: index === selected ? 1 : 0.45,
                }}
              />
            </View>
          </Pressable>
        ))}
      </View>

      <View className="flex-row justify-between gap-1">
        {buckets.map((bucket, index) => (
          <Text
            key={bucket.month}
            className={
              index === selected
                ? "flex-1 text-center text-[10px] font-bold text-fg"
                : "flex-1 text-center text-[10px] text-fg-muted"
            }
          >
            {formatMonthShort(bucket.date, locale)}
          </Text>
        ))}
      </View>

      {active ? (
        <View className="flex-col gap-1 rounded-2xl bg-elevated p-3">
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
