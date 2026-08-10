import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { DebtStatus } from "@/db";

type DebtStatusChipProps = {
  status: DebtStatus;
  billed: number;
  paid: number;
};

type ChipKind = "settled" | "partial" | "ongoing" | "cancelled" | "writtenOff";

// Full class strings per kind: cn only concatenates, so a colour layered over
// another would leave both applied and the winner up to stylesheet order.
const CHIP: Record<ChipKind, string> = {
  settled: "rounded-full bg-primary px-2 py-0.5",
  partial: "rounded-full bg-primary-soft px-2 py-0.5",
  ongoing: "rounded-full bg-elevated px-2 py-0.5",
  cancelled: "rounded-full bg-elevated px-2 py-0.5",
  writtenOff: "rounded-full bg-elevated px-2 py-0.5",
};

const LABEL: Record<ChipKind, string> = {
  settled: "text-[11px] font-semibold text-primary-fg",
  partial: "text-[11px] font-semibold text-primary",
  ongoing: "text-[11px] font-semibold text-fg-muted",
  cancelled: "text-[11px] font-semibold text-fg-muted",
  writtenOff: "text-[11px] font-semibold text-fg-muted",
};

const LABEL_KEYS = {
  settled: "debts.statusSettled",
  partial: "debts.statusPartial",
  ongoing: "debts.statusOngoing",
  cancelled: "debts.statusCancelled",
  writtenOff: "debts.statusWrittenOff",
} as const;

/**
 * The debt's own status, everywhere it appears.
 *
 * `status` is read before the money is: a cancelled debt with nothing paid is
 * not "unpaid", and a written-off one is certainly not "settled" — which is
 * exactly what a paid-versus-billed comparison alone would call them.
 */
export function debtChipKind(
  status: DebtStatus,
  billed: number,
  paid: number,
): ChipKind {
  if (status === "cancelled") return "cancelled";
  if (status === "written_off") return "writtenOff";
  if (status === "settled" || (billed > 0 && paid >= billed)) return "settled";
  return paid > 0 ? "partial" : "ongoing";
}

export function DebtStatusChip({ status, billed, paid }: DebtStatusChipProps) {
  const { t } = useTranslation();
  const kind = debtChipKind(status, billed, paid);

  return (
    <View className={CHIP[kind]}>
      <Text className={LABEL[kind]}>{t(LABEL_KEYS[kind])}</Text>
    </View>
  );
}
