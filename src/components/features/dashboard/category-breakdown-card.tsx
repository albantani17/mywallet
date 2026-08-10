import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import {
  BUILT_IN_LABEL_KEYS,
  toIconName,
} from "@/components/features/transactions/transaction-category";
import type { CategorySlice } from "@/services/insight";
import type { Insights } from "@/hooks/features/dashboard/use-insights";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";
import { startOfDay, endOfDay } from "@/utils/format-date";

type CategoryBreakdownCardProps = { insights: Insights };

const FALLBACK_COLOR = "#8a978c";

/**
 * Where the month's money went: the five biggest categories, the remainder
 * rolled into one row, and the single largest transaction underneath.
 *
 * Debt repayments are absent by construction — they are principal moving back,
 * not spending, and letting an instalment top this list would bury the
 * categories the user can actually act on.
 */
export function CategoryBreakdownCard({ insights }: CategoryBreakdownCardProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const money = (value: number) => formatCurrency(value, locale);
  const { breakdown, largest, month } = insights;

  const labelOf = useCallback(
    (slice: CategorySlice) => {
      if (slice.isOther) return t("insights.otherCategories");
      if (!slice.slug) return slice.name ?? t("insights.uncategorised");

      const key =
        BUILT_IN_LABEL_KEYS[slice.slug as keyof typeof BUILT_IN_LABEL_KEYS];
      return key ? t(key) : (slice.name ?? t("insights.uncategorised"));
    },
    [t],
  );

  /** Straight into the transaction list, already filtered the same way. */
  const openCategory = useCallback(
    (slice: CategorySlice) => {
      if (slice.isOther || slice.categoryId === null) return;

      router.push({
        pathname: "/transactions",
        params: {
          categoryId: String(slice.categoryId),
          from: String(month.from.getTime()),
          to: String(month.to.getTime()),
        },
      });
    },
    [month],
  );

  const openLargest = useCallback(() => {
    if (!largest) return;

    // No transaction detail screen exists, so the honest destination is the
    // list narrowed to that day, where the row is right there.
    router.push({
      pathname: "/transactions",
      params: {
        from: String(startOfDay(largest.occurredAt).getTime()),
        to: String(endOfDay(largest.occurredAt).getTime()),
      },
    });
  }, [largest]);

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <Text className="text-sm font-bold text-fg">
        {t("insights.breakdownTitle")}
      </Text>

      {breakdown.slices.length === 0 ? (
        <Text className="text-xs text-fg-muted">{t("insights.noSpending")}</Text>
      ) : (
        breakdown.slices.map((slice) => (
          <Pressable
            key={slice.isOther ? "other" : slice.categoryId}
            accessibilityRole="button"
            disabled={slice.isOther || slice.categoryId === null}
            onPress={() => openCategory(slice)}
            className="flex-col gap-1 active:opacity-70"
          >
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-xs font-medium text-fg" numberOfLines={1}>
                {labelOf(slice)}
              </Text>
              <Text className="text-[11px] text-fg-muted">
                {Math.round(slice.share * 100)}%
              </Text>
              <Text className="text-xs font-semibold text-fg">
                {money(slice.total)}
              </Text>
            </View>

            {/* The width has to be an inline style: Uniwind resolves classes
                from the literal source text, so a computed w-[38%] is nothing. */}
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(slice.share * 100, 2)}%`,
                  backgroundColor: slice.isOther
                    ? colors.fgMuted
                    : (slice.color ?? FALLBACK_COLOR),
                }}
              />
            </View>
          </Pressable>
        ))
      )}

      {largest ? (
        <Pressable
          accessibilityRole="button"
          onPress={openLargest}
          className="mt-1 flex-row items-center gap-2 rounded-2xl bg-elevated p-3 active:opacity-70"
        >
          <View
            className="size-8 flex-col items-center justify-center rounded-xl"
            style={{ backgroundColor: `${largest.categoryColor ?? FALLBACK_COLOR}22` }}
          >
            <Ionicons
              name={toIconName(largest.categoryIcon)}
              size={15}
              color={largest.categoryColor ?? FALLBACK_COLOR}
            />
          </View>

          <View className="flex-1 flex-col">
            <Text className="text-[11px] text-fg-muted">
              {t("insights.largest")}
            </Text>
            <Text className="text-xs font-medium text-fg" numberOfLines={1}>
              {largest.note?.trim() ||
                largest.categoryName ||
                largest.walletName ||
                t("insights.uncategorised")}
            </Text>
          </View>

          <Text className="text-xs font-bold text-fg">
            {money(largest.amount)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
