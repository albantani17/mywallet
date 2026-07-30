import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { DebtWithOutstanding } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";

type ReceivableRowProps = {
  debt: DebtWithOutstanding;
  /** Passed in by the list so every row agrees on when "today" is. */
  now: Date;
};

/** Due before today, with money still owed. */
function isOverdue(dueDate: Date | null, outstanding: number, now: Date) {
  if (!dueDate || outstanding <= 0) return false;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return dueDate.getTime() < startOfToday.getTime();
}

export function ReceivableRow({ debt, now }: ReceivableRowProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const outstanding = Number(debt.outstanding);
  const overdue = isOverdue(debt.dueDate, outstanding, now);
  // Partly repaid: the principal alone no longer says what is still owed.
  const isPartlyPaid = outstanding !== Number(debt.principal);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
      <View className="size-10 flex-col items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name="person-outline" size={18} color={colors.primary} />
      </View>

      <View className="flex-1 flex-col">
        <Text className="text-base font-semibold text-fg" numberOfLines={1}>
          {debt.counterparty}
        </Text>
        <Text className="mt-0.5 text-xs text-fg-muted" numberOfLines={1}>
          {[formatDate(debt.issuedAt, locale), debt.note]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {debt.dueDate ? (
          <Text
            className={cn(
              "mt-1 text-xs font-medium",
              overdue ? "text-danger" : "text-fg-muted",
            )}
          >
            {overdue
              ? t("debts.overdue")
              : t("debts.dueOn", { date: formatDate(debt.dueDate, locale) })}
          </Text>
        ) : null}
      </View>

      <View className="flex-col items-end">
        <Text className="text-base font-bold text-primary" numberOfLines={1}>
          {formatCurrency(outstanding, locale)}
        </Text>
        {isPartlyPaid ? (
          <Text className="mt-0.5 text-xs text-fg-muted" numberOfLines={1}>
            {t("debts.outstanding")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
