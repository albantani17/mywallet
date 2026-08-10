import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { Insights } from "@/hooks/features/dashboard/use-insights";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";

type IncomeExpenseBarProps = { insights: Insights };

/**
 * The month in one bar: money in against money out, each taking the share of
 * the bar it takes of the month's movement, so the dominant side is visibly
 * the dominant side.
 *
 * First on the screen because it is the one line that says whether the month is
 * going well — everything below it explains why.
 *
 * Widths are inline styles: Uniwind resolves classes from the literal source
 * text, so a computed `w-[60%]` would resolve to nothing at all.
 */
export function IncomeExpenseBar({ insights }: IncomeExpenseBarProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const { income, expense } = insights.thisMonth;
  const { incomePercent, expensePercent, dominant, isEmpty } = insights.split;

  // Nothing in and nothing out: an empty bar would only take up room.
  if (isEmpty) return null;

  const money = (value: number) => formatCurrency(value, locale);

  return (
    <View className="mx-6 flex-col gap-2 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text
          className={
            dominant === "income"
              ? "text-sm font-bold text-primary"
              : "text-sm font-medium text-fg-muted"
          }
        >
          {t("insights.income")} {incomePercent}%
        </Text>
        <Text
          className={
            dominant === "expense"
              ? "text-sm font-bold text-danger"
              : "text-sm font-medium text-fg-muted"
          }
        >
          {t("insights.expense")} {expensePercent}%
        </Text>
      </View>

      {/* One track, two segments. A side that rounds to 0% keeps a sliver so
          the bar never looks like it lost a colour entirely. */}
      <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-elevated">
        <View
          className="h-full bg-primary"
          style={{ width: `${income > 0 ? Math.max(incomePercent, 2) : 0}%` }}
        />
        <View
          className="h-full flex-1 bg-danger"
          style={{ opacity: expense > 0 ? 1 : 0 }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] text-fg-muted">{money(income)}</Text>
        <Text className="text-[11px] text-fg-muted">{money(expense)}</Text>
      </View>
    </View>
  );
}
