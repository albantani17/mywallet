import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { InsightPeriodControls } from "@/hooks/features/dashboard/use-insight-period";
import type { Insights } from "@/hooks/features/dashboard/use-insights";

import { CashFlowChart } from "./cash-flow-chart";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { DailyAllowanceCard } from "./daily-allowance-card";
import { IncomeExpenseBar } from "./income-expense-bar";
import {
  InsightCustomRange,
  InsightPeriodTrigger,
} from "./insight-period-picker";
import { MonthSummaryCard } from "./month-summary-card";

type InsightSectionProps = {
  insights: Insights;
  periodControls: InsightPeriodControls;
};

/**
 * What can be spent today first, then the picked period widest first: how the
 * money split between in and out, how much was spent, where it went, and how
 * it moved over time. Everything is derived from transactions already recorded
 * in the main funds — the user is never asked to plan or budget anything first.
 */
export function InsightSection({
  insights,
  periodControls,
}: InsightSectionProps) {
  const { t } = useTranslation();

  if (!insights.isReady) return null;

  const { from, to } = insights.resolved;

  return (
    <View className="flex-col gap-4">
      <View className="px-6">
        <Text className="text-lg font-bold text-fg">{t("insights.title")}</Text>
      </View>

      <DailyAllowanceCard insights={insights} />

      <View className="flex-row items-center justify-between px-6 pt-2">
        <Text className="text-sm font-semibold text-fg-muted">
          {t("insights.trendTitle")}
        </Text>
        <InsightPeriodTrigger controls={periodControls} />
      </View>

      <InsightCustomRange controls={periodControls} />

      <IncomeExpenseBar insights={insights} />
      <MonthSummaryCard insights={insights} />
      <CategoryBreakdownCard insights={insights} />
      {/* Keyed by the window so a new period starts on its newest bar. */}
      <CashFlowChart
        key={`${from.getTime()}-${to.getTime()}`}
        insights={insights}
      />
    </View>
  );
}
