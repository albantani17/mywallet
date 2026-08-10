import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { DebtWithSummary } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { debtTone, type DebtProgress } from "@/services/debt-status";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

import { DebtStatusChip } from "./debt-status-chip";

type DebtDetailHeaderProps = {
  debt: DebtWithSummary;
  progress: DebtProgress;
};

/**
 * The card at the top of the detail screen.
 *
 * Every figure comes from `progress` — summed from the installments with the
 * screen's own clock and grace period — rather than from the SQL columns on
 * the debt row, which use a clock of their own. Two sources would eventually
 * disagree about whether a row is late, on the same screen.
 */
export function DebtDetailHeader({ debt, progress }: DebtDetailHeaderProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const tone = debtTone({ ...debt, overdueCount: progress.overdueCount });
  const money = (value: number) => formatCurrency(value, locale, debt.currency);

  return (
    <View className="mb-4 flex-col gap-4 rounded-3xl bg-surface p-5">
      <View className="flex-row items-center gap-3">
        <View className="size-10 flex-col items-center justify-center rounded-full bg-primary-soft">
          <Ionicons
            name={
              debt.counterpartyKind === "institution"
                ? "business-outline"
                : "person-outline"
            }
            size={18}
            color={colors.primary}
          />
        </View>

        <View className="flex-1 flex-col">
          <Text className="text-base font-semibold text-fg" numberOfLines={1}>
            {debt.title}
          </Text>
          <Text className="mt-0.5 text-xs text-fg-muted" numberOfLines={1}>
            {debt.counterpartyName ?? "—"}
          </Text>
        </View>

        <DebtStatusChip
          status={debt.status}
          billed={progress.billed}
          paid={progress.paid}
        />
      </View>

      <View className="flex-col gap-2">
        <Text className="text-xs text-fg-muted">{t("debtDetail.outstanding")}</Text>
        <Text className="text-3xl font-extrabold text-fg" adjustsFontSizeToFit>
          {money(progress.outstanding)}
        </Text>

        <ProgressBar
          ratio={progress.ratio}
          tone={debt.status === "active" ? "primary" : "muted"}
        />

        <Text className="text-[11px] text-fg-muted">
          {t("debtDetail.progress", {
            paid: money(progress.paid),
            billed: money(progress.billed),
          })}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {/* An `open` schedule has no date to miss, so it says so rather than
            leaving the line blank and looking unfinished. */}
        <Text
          className={cn(
            "flex-1 text-xs",
            tone === "overdue" ? "text-danger" : "text-fg-muted",
          )}
        >
          {debt.nextDueDate
            ? t("debtDetail.nextDue", {
                date: formatDate(debt.nextDueDate, locale),
              })
            : t("debtDetail.noDueDate")}
        </Text>

        {progress.overdueCount > 0 ? (
          <Text
            className={cn(
              "text-xs font-medium",
              tone === "overdue" ? "text-danger" : "text-fg-muted",
            )}
          >
            {t("debtDetail.overdueInstallments", {
              count: progress.overdueCount,
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
