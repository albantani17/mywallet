import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { CounterpartyKind } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { DebtProgress, DueBreakdown } from "@/services/debt-status";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

import { InstallmentStatusChip } from "./installment-status-chip";

type PaymentDueCardProps = {
  due: DueBreakdown;
  progress: DebtProgress;
  counterpartyKind: CounterpartyKind | null;
  /** The schedule's own per-period figure, when it has one. */
  installmentAmount: number | null;
  graceDays: number;
  now: Date;
  currency: string;
};

/**
 * The bill, before the amount field.
 *
 * Without it the form offered a single total and a prefilled "pay everything",
 * which answers how much is left but not how much is owed this month — so the
 * user had to leave the form to find out, or guess. Everything here is derived
 * from the same installments the allocation preview below will settle.
 */
export function PaymentDueCard({
  due,
  progress,
  counterpartyKind,
  installmentAmount,
  graceDays,
  now,
  currency,
}: PaymentDueCardProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  // Nothing left to bill: the remaining balance, if any, is rounding rather
  // than an installment, and a card about "the next one" would be a lie.
  if (!due.next) return null;

  const money = (value: number) => formatCurrency(value, locale, currency);

  return (
    <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-5">
      <Text className="text-sm font-bold text-fg">{t("newPayment.dueTitle")}</Text>

      <View className="flex-col gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-fg">
            {t("newPayment.dueInstallment", { sequence: due.next.sequence })}
          </Text>
          <InstallmentStatusChip
            installment={due.next}
            counterpartyKind={counterpartyKind}
            graceDays={graceDays}
            now={now}
          />
        </View>

        <Text className="text-xl font-extrabold text-fg" adjustsFontSizeToFit>
          {money(due.nextRemaining)}
        </Text>

        <Text className="text-xs text-fg-muted">
          {due.next.dueDate
            ? t("newPayment.dueOn", {
                date: formatDate(due.next.dueDate, locale),
              })
            : t("newPayment.dueNoDate")}
        </Text>
      </View>

      {/* Arrears are what a single-installment default would quietly skip. */}
      {due.arrearsCount > 0 ? (
        <Text className="text-xs font-medium text-fg">
          {t("newPayment.dueArrears", {
            count: due.arrearsCount,
            amount: money(due.arrearsAmount),
          })}
        </Text>
      ) : null}

      <View className="flex-col gap-1.5">
        <ProgressBar ratio={progress.ratio} />
        <Text className="text-[11px] text-fg-muted">
          {t("newPayment.dueProgress", {
            paid: progress.paidCount,
            count: progress.installmentCount,
          })}
        </Text>
      </View>

      {installmentAmount ? (
        <Text className="text-[11px] text-fg-muted">
          {t("newPayment.duePerPeriod", { amount: money(installmentAmount) })}
        </Text>
      ) : null}
    </View>
  );
}
