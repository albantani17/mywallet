import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { CounterpartyKind } from "@/db";
import { installmentStatus, type StatusInstallment } from "@/services/debt-status";

import { installmentTone, type InstallmentTone } from "./installment-tone";

type InstallmentStatusChipProps = {
  installment: StatusInstallment;
  counterpartyKind: CounterpartyKind | null;
  graceDays: number;
  now: Date;
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
 * Where one installment stands, wherever it is shown.
 *
 * Shared by the detail list and the payment form so the same row cannot be
 * called "late" in one place and "overdue" in the other — the colour goes
 * through `installmentTone`, which is the only place that knows a debt to a
 * person must never turn red.
 */
export function InstallmentStatusChip({
  installment,
  counterpartyKind,
  graceDays,
  now,
}: InstallmentStatusChipProps) {
  const { t } = useTranslation();

  const tone = installmentTone(
    installmentStatus(installment, { graceDays, now }),
    counterpartyKind,
  );

  return (
    <View className={CHIP[tone]}>
      <Text className={CHIP_LABEL[tone]}>{t(LABEL_KEYS[tone])}</Text>
    </View>
  );
}
