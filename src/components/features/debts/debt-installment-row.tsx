import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { CounterpartyKind, InstallmentWithPaid } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

import { InstallmentStatusChip } from "./installment-status-chip";

type DebtInstallmentRowProps = {
  installment: InstallmentWithPaid;
  counterpartyKind: CounterpartyKind | null;
  graceDays: number;
  now: Date;
  currency: string;
  onEdit: (installment: InstallmentWithPaid) => void;
};

/**
 * One obligation.
 *
 * The chip colour goes through `installmentTone`, which is the only place that
 * knows a debt to a person must never turn red however late it is.
 */
export function DebtInstallmentRow({
  installment,
  counterpartyKind,
  graceDays,
  now,
  currency,
  onEdit,
}: DebtInstallmentRowProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const money = (value: number) => formatCurrency(value, locale, currency);
  const wasMoved =
    installment.isModified &&
    installment.originalDueDate !== null &&
    installment.dueDate !== null &&
    installment.originalDueDate.getTime() !== installment.dueDate.getTime();

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
      <Text className="w-8 text-xs font-semibold text-fg-muted">
        #{installment.sequence}
      </Text>

      <View className="flex-1 flex-col gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-fg">
            {installment.dueDate
              ? formatDate(installment.dueDate, locale)
              : t("debtDetail.noDueDate")}
          </Text>
          <InstallmentStatusChip
            installment={installment}
            counterpartyKind={counterpartyKind}
            graceDays={graceDays}
            now={now}
          />
        </View>

        <Text className="text-[11px] text-fg-muted">
          {t("debtDetail.installmentOf", {
            paid: money(installment.paidAmount),
            total: money(installment.totalAmount),
          })}
        </Text>

        {/* Kept visible so an edit is never silent: the row says where it moved
            from, which is what `originalDueDate` exists for. */}
        {wasMoved ? (
          <Text className="text-[11px] text-fg-muted line-through">
            {t("debtDetail.installmentModified", {
              date: formatDate(installment.originalDueDate as Date, locale),
            })}
          </Text>
        ) : null}
      </View>

      <View className="flex-col items-end gap-1">
        <Text className="text-sm font-bold text-fg">
          {money(installment.totalAmount)}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("debts.actions.edit")}
          onPress={() => onEdit(installment)}
          hitSlop={8}
          className="size-8 flex-col items-center justify-center rounded-full bg-elevated active:opacity-70"
        >
          <Ionicons name="create-outline" size={15} color={colors.fgMuted} />
        </Pressable>
      </View>
    </View>
  );
}
