import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { Insights } from "@/hooks/features/dashboard/use-insights";

import { CashFlowChart } from "./cash-flow-chart";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { IncomeExpenseBar } from "./income-expense-bar";
import { MonthSummaryCard } from "./month-summary-card";

type InsightSectionProps = { insights: Insights };

/**
 * Four answers, widest first: how much of the month's income is gone, how much
 * has been spent, where it went, and how the last six months compare.
 * Everything is derived from transactions already recorded — the user is never
 * asked to plan or budget anything first.
 */
export function InsightSection({ insights }: InsightSectionProps) {
  const { t } = useTranslation();

  if (!insights.isReady) return null;

  return (
    <View className="flex-col gap-4">
      <View className="px-6">
        <Text className="text-lg font-bold text-fg">{t("insights.title")}</Text>
      </View>

      <IncomeExpenseBar insights={insights} />
      <MonthSummaryCard insights={insights} />
      <CategoryBreakdownCard insights={insights} />
      <CashFlowChart insights={insights} />
    </View>
  );
}
