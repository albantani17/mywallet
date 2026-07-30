import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

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

  const paid = Number(debt.paid);
  const principal = Number(debt.principal);
  // Clamped: overpaying leaves a negative remainder, which is not a debt owed
  // back — the debt is simply closed.
  const outstanding = Math.max(Number(debt.outstanding), 0);

  const isSettled = debt.status === "settled";
  const isPartlyPaid = !isSettled && paid > 0;
  const overdue = isOverdue(debt.dueDate, outstanding, now);

  const openPayment = () => router.push(`/debts/${debt.id}/pay`);

  return (
    <View
      className={cn(
        "flex-col gap-3 rounded-2xl bg-surface p-4",
        // A closed debt is history, not a to-do; it steps back visually.
        isSettled && "opacity-60",
      )}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "size-10 flex-col items-center justify-center rounded-full",
            isSettled ? "bg-elevated" : "bg-primary-soft",
          )}
        >
          <Ionicons
            name={isSettled ? "checkmark-circle-outline" : "person-outline"}
            size={18}
            color={isSettled ? colors.fgMuted : colors.primary}
          />
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
        </View>

        <View className="flex-col items-end">
          <Text
            className={cn(
              "text-base font-bold",
              isSettled ? "text-fg-muted" : "text-primary",
            )}
            numberOfLines={1}
          >
            {formatCurrency(isSettled ? principal : outstanding, locale)}
          </Text>
          <Text className="mt-0.5 text-[11px] text-fg-muted">
            {isSettled ? t("debts.total") : t("debts.outstanding")}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <View
          className={cn(
            "rounded-full px-2 py-0.5",
            isSettled
              ? "bg-primary"
              : isPartlyPaid
                ? "bg-primary-soft"
                : "bg-elevated",
          )}
        >
          <Text
            className={cn(
              "text-[11px] font-semibold",
              // The settled badge sits on a solid fill, so its label follows
              // the fill rather than the theme.
              isSettled
                ? "text-primary-fg"
                : isPartlyPaid
                  ? "text-primary"
                  : "text-fg-muted",
            )}
          >
            {isSettled
              ? t("debts.statusSettled")
              : isPartlyPaid
                ? t("debts.statusPartial")
                : t("debts.statusOngoing")}
          </Text>
        </View>

        {paid > 0 ? (
          <Text className="text-[11px] text-fg-muted">
            {t("debts.paidOf", {
              paid: formatCurrency(paid, locale),
              principal: formatCurrency(principal, locale),
            })}
          </Text>
        ) : null}

        {debt.dueDate && !isSettled ? (
          <Text
            className={cn(
              "text-[11px] font-medium",
              overdue ? "text-danger" : "text-fg-muted",
            )}
          >
            {overdue
              ? t("debts.overdue")
              : t("debts.dueOn", { date: formatDate(debt.dueDate, locale) })}
          </Text>
        ) : null}
      </View>

      {isSettled ? null : (
        <Pressable
          accessibilityRole="button"
          onPress={openPayment}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-primary px-3 py-2 active:opacity-70"
        >
          <Ionicons name="arrow-down-circle-outline" size={16} color={colors.primary} />
          <Text className="text-sm font-semibold text-primary">
            {t("debts.recordPayment")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
