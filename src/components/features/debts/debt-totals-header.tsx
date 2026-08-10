import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { DebtDirection } from "@/db";
import { useDebtTotals } from "@/hooks/features/debts/use-debt-totals";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/utils/cn";

type DebtTotalsHeaderProps = { direction: DebtDirection };

/**
 * What the active direction still owes, in one line.
 *
 * The overdue chip is only alarming for a `payable`: money the user owes and
 * has not paid is their problem to fix today. On the receivable side the same
 * number is someone else's lateness, so it stays a neutral count — turning it
 * red would put the user's friends in an error state.
 */
export function DebtTotalsHeader({ direction }: DebtTotalsHeaderProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const totals = useDebtTotals();

  const { outstanding, debtCount, overdueCount } =
    direction === "payable" ? totals.payable : totals.receivable;

  return (
    <View className="mx-6 mb-4 flex-col gap-1 rounded-3xl bg-surface p-5">
      <Text className="text-xs text-fg-muted">{t("debts.totalOutstanding")}</Text>
      <Text className="text-2xl font-extrabold text-fg" adjustsFontSizeToFit>
        {formatCurrency(outstanding, locale)}
      </Text>

      <View className="mt-1 flex-row items-center gap-2">
        <Text className="text-[11px] text-fg-muted">
          {t("debts.debtCount", { count: debtCount })}
        </Text>

        {overdueCount > 0 ? (
          <View
            className={cn(
              "rounded-full px-2 py-0.5",
              direction === "payable" ? "bg-danger" : "bg-elevated",
            )}
          >
            <Text
              className={cn(
                "text-[11px] font-semibold",
                direction === "payable" ? "text-primary-fg" : "text-fg-muted",
              )}
            >
              {t("debts.overdueCount", { count: overdueCount })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
