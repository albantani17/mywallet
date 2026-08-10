import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { DebtWithSummary } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { debtTone, type DebtTone } from "@/services/debt-status";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

import { DebtStatusChip } from "./debt-status-chip";

type DebtRowProps = { debt: DebtWithSummary };

// Full class strings per tone: cn only concatenates, so a colour layered over
// another would leave both applied and the winner up to stylesheet order.
const TONE_TEXT: Record<DebtTone, string> = {
  settled: "text-fg-muted",
  overdue: "text-danger",
  due: "text-fg-muted",
  neutral: "text-fg-muted",
};

/**
 * One debt in the list.
 *
 * Every figure is read off the row rather than recomputed: `billed`, `paid`
 * and `outstanding` are summed in SQL from the installments and their
 * allocations, so a restructure or a penalty is already inside them.
 *
 * The amount is never rendered in the danger colour. Owing money is not an
 * error state — only a missed date on an institutional debt is, and that goes
 * on the chip, decided by `debtTone`.
 */
export function DebtRow({ debt }: DebtRowProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const tone = debtTone(debt);
  const isSettled = tone === "settled";

  const meta = [debt.counterpartyName, formatDate(debt.originDate, locale)]
    .filter(Boolean)
    .join(" · ");

  const openDetail = useCallback(() => {
    router.push({ pathname: "/debts/[id]", params: { id: debt.id } });
  }, [debt.id]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={debt.title}
      onPress={openDetail}
      className={cn(
        "flex-col gap-3 rounded-2xl bg-surface p-4 active:opacity-70",
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
            name={
              isSettled
                ? "checkmark-circle-outline"
                : debt.counterpartyKind === "institution"
                  ? "business-outline"
                  : "person-outline"
            }
            size={18}
            color={isSettled ? colors.fgMuted : colors.primary}
          />
        </View>

        <View className="flex-1 flex-col">
          <Text className="text-base font-semibold text-fg" numberOfLines={1}>
            {debt.title}
          </Text>
          {meta ? (
            <Text className="mt-0.5 text-xs text-fg-muted" numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>

        <View className="flex-col items-end">
          <Text
            className={cn(
              "text-base font-bold",
              isSettled
                ? "text-fg-muted"
                : debt.direction === "receivable"
                  ? "text-primary"
                  : "text-fg",
            )}
            numberOfLines={1}
          >
            {formatCurrency(
              isSettled ? debt.billed : debt.outstanding,
              locale,
              debt.currency,
            )}
          </Text>
          <Text className="mt-0.5 text-[11px] text-fg-muted">
            {t(isSettled ? "debts.total" : "debts.outstanding")}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <DebtStatusChip
          status={debt.status}
          billed={debt.billed}
          paid={debt.paid}
        />

        <DueLabel debt={debt} tone={tone} />

        {debt.billed > 0 && !isSettled ? (
          <Text className="text-[11px] text-fg-muted">
            {t("debts.paidOf", {
              paid: formatCurrency(debt.paid, locale, debt.currency),
              principal: formatCurrency(debt.billed, locale, debt.currency),
            })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * The date line. An overdue institutional debt gets the red chip; a person's
 * debt that slipped past its date gets the same information in muted text,
 * because a loan from a friend is a conversation, not an alarm.
 */
function DueLabel({ debt, tone }: { debt: DebtWithSummary; tone: DebtTone }) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  if (tone === "settled" || tone === "neutral" || !debt.nextDueDate) {
    return null;
  }

  if (tone === "overdue") {
    return (
      <View className="rounded-full bg-danger px-2 py-0.5">
        <Text className="text-[11px] font-semibold text-primary-fg">
          {t("debts.overdue")}
        </Text>
      </View>
    );
  }

  return (
    <Text className={cn("text-[11px] font-medium", TONE_TEXT[tone])}>
      {debt.overdueCount > 0
        ? t("debts.pastDue")
        : t("debts.dueOn", { date: formatDate(debt.nextDueDate, locale) })}
    </Text>
  );
}
