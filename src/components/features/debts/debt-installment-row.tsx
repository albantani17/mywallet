import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { CounterpartyKind, InstallmentWithPaid } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { installmentStatus } from "@/services/debt-status";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

import { installmentTone, type InstallmentTone } from "./installment-tone";

type DebtInstallmentRowProps = {
  installment: InstallmentWithPaid;
  counterpartyKind: CounterpartyKind | null;
  graceDays: number;
  now: Date;
  currency: string;
  onEdit: (installment: InstallmentWithPaid) => void;
};

// Full class strings per tone: cn only concatenates, so a colour layered over
// another would leave both applied and the winner up to stylesheet order.
const CHIP: Record<InstallmentTone, string> = {
  paid: "rounded-full bg-primary px-2 py-0.5",
  partial: "rounded-full bg-primary-soft px-2 py-0.5",
  overdue: "rounded-full bg-danger px-2 py-0.5",
  late: "rounded-full bg-elevated px-2 py-0.5",
  upcoming: "rounded-full bg-elevated px-2 py-0.5",
  open: "rounded-full bg-elevated px-2 py-0.5",
};

const CHIP_LABEL: Record<InstallmentTone, string> = {
  paid: "text-[11px] font-semibold text-primary-fg",
  partial: "text-[11px] font-semibold text-primary",
  overdue: "text-[11px] font-semibold text-primary-fg",
  late: "text-[11px] font-semibold text-fg-muted",
  upcoming: "text-[11px] font-semibold text-fg-muted",
  open: "text-[11px] font-semibold text-fg-muted",
};

const LABEL_KEYS = {
  paid: "debts.installmentStatus.paid",
  partial: "debts.installmentStatus.partial",
  overdue: "debts.installmentStatus.overdue",
  late: "debts.installmentStatus.late",
  upcoming: "debts.installmentStatus.upcoming",
  open: "debts.installmentStatus.open",
} as const;

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

  const tone = installmentTone(
    installmentStatus(installment, { graceDays, now }),
    counterpartyKind,
  );

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
          <View className={CHIP[tone]}>
            <Text className={CHIP_LABEL[tone]}>{t(LABEL_KEYS[tone])}</Text>
          </View>
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
