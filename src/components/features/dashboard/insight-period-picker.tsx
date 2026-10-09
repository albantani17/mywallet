import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import type { InsightPeriodControls } from "@/hooks/features/dashboard/use-insight-period";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { INSIGHT_PERIODS } from "@/services/insight";

const PERIOD_LABEL_KEYS = {
  thisMonth: "insights.periods.thisMonth",
  lastMonth: "insights.periods.lastMonth",
  last3Months: "insights.periods.last3Months",
  last6Months: "insights.periods.last6Months",
  last12Months: "insights.periods.last12Months",
  custom: "insights.periods.custom",
} as const;

type InsightPeriodPickerProps = { controls: InsightPeriodControls };

/** The period dropdown beside the insights title. */
export function InsightPeriodTrigger({ controls }: InsightPeriodPickerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { period } = controls.selection;

  const items = INSIGHT_PERIODS.map((key) => ({
    key,
    label: t(PERIOD_LABEL_KEYS[key]),
    onPress: () => controls.setPeriod(key),
  }));

  return (
    <DropdownMenu
      items={items}
      selectedKey={period}
      accessibilityLabel={t("insights.periods.label")}
      trigger={
        <View className="h-9 flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3">
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text className="text-xs font-semibold text-fg">
            {t(PERIOD_LABEL_KEYS[period])}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.fgMuted} />
        </View>
      }
    />
  );
}

/**
 * The two dates of a custom period, inline under the title. Not inside a sheet:
 * DateField opens a sheet of its own, and stacking sheets is not worth it.
 */
export function InsightCustomRange({ controls }: InsightPeriodPickerProps) {
  const { t } = useTranslation();
  const { period, customFrom, customTo } = controls.selection;

  if (period !== "custom") return null;

  return (
    <View className="flex-row gap-2 px-6">
      <View className="flex-1">
        <DateField
          label={t("transactions.filters.from")}
          value={customFrom}
          onChange={controls.setCustomFrom}
        />
      </View>
      <View className="flex-1">
        <DateField
          label={t("transactions.filters.to")}
          value={customTo}
          onChange={controls.setCustomTo}
        />
      </View>
    </View>
  );
}
