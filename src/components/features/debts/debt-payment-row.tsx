import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { PaymentWithAllocations } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

type DebtPaymentRowProps = {
  payment: PaymentWithAllocations;
  currency: string;
  onDelete: (payment: PaymentWithAllocations) => void;
};

const METHOD_KEYS = {
  transfer: "debtDetail.paymentMethod.transfer",
  cash: "debtDetail.paymentMethod.cash",
  autodebit: "debtDetail.paymentMethod.autodebit",
  other: "debtDetail.paymentMethod.other",
} as const;

/**
 * One payment in the history.
 *
 * `unallocated` is shown rather than hidden: money that reached no installment
 * is the one thing that can make the outstanding total look wrong, so it says
 * so on the row instead of quietly disappearing into the debt.
 */
export function DebtPaymentRow({
  payment,
  currency,
  onDelete,
}: DebtPaymentRowProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const meta = [
    t(
      payment.method
        ? METHOD_KEYS[payment.method]
        : "debtDetail.paymentMethod.unspecified",
    ),
    payment.walletName,
    payment.note,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
      <View className="size-10 flex-col items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name="arrow-down-circle-outline" size={18} color={colors.primary} />
      </View>

      <View className="flex-1 flex-col">
        <Text className="text-sm font-semibold text-fg">
          {formatDate(payment.paidAt, locale)}
        </Text>
        <Text className="mt-0.5 text-[11px] text-fg-muted" numberOfLines={1}>
          {meta}
        </Text>
        {payment.unallocated > 0 ? (
          <Text className="mt-0.5 text-[11px] text-fg-muted">
            {t("debtDetail.paymentUnallocated", {
              amount: formatCurrency(payment.unallocated, locale, currency),
            })}
          </Text>
        ) : null}
      </View>

      <View className="flex-col items-end gap-1">
        <Text className="text-sm font-bold text-primary">
          {formatCurrency(payment.amount, locale, currency)}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("debts.actions.deletePayment")}
          onPress={() => onDelete(payment)}
          hitSlop={8}
          className="size-8 flex-col items-center justify-center rounded-full bg-elevated active:opacity-70"
        >
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}
