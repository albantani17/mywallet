import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type DebtConfirmKind =
  | "cancel"
  | "writeOff"
  | "deleteDebt"
  | "deletePayment";

type DebtConfirmSheetProps = {
  kind: DebtConfirmKind;
  isOpen: boolean;
  /** Interpolated into the delete-debt title. */
  title?: string;
  error?: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const COPY = {
  cancel: {
    title: "debtDetail.confirm.cancelTitle",
    message: "debtDetail.confirm.cancelMessage",
    confirm: "debtDetail.confirm.cancelConfirm",
  },
  writeOff: {
    title: "debtDetail.confirm.writeOffTitle",
    message: "debtDetail.confirm.writeOffMessage",
    confirm: "debtDetail.confirm.writeOffConfirm",
  },
  deleteDebt: {
    title: "debtDetail.confirm.deleteTitle",
    message: "debtDetail.confirm.deleteMessage",
    confirm: "debtDetail.confirm.deleteConfirm",
  },
  deletePayment: {
    title: "debtDetail.confirm.deletePaymentTitle",
    message: "debtDetail.confirm.deletePaymentMessage",
    confirm: "debtDetail.confirm.deletePaymentConfirm",
  },
} as const;

const ICONS: Record<
  DebtConfirmKind,
  ComponentProps<typeof Ionicons>["name"]
> = {
  cancel: "close-circle-outline",
  writeOff: "document-text-outline",
  deleteDebt: "trash-outline",
  deletePayment: "trash-outline",
};

/**
 * One sheet for every irreversible-ish action on this screen.
 *
 * No type-the-name gate, unlike the wallet delete sheet: delete is only
 * offered on a debt with no payments, so there is no history to lose, and
 * cancel and write-off keep everything and can be undone by editing the debt.
 * The ceremony would cost more than it protects.
 */
export function DebtConfirmSheet({
  kind,
  isOpen,
  title,
  error,
  isSubmitting,
  onConfirm,
  onClose,
}: DebtConfirmSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const copy = COPY[kind];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-elevated">
            <Ionicons name={ICONS[kind]} size={20} color={colors.danger} />
          </View>
          <Text className="flex-1 text-xl font-bold text-fg">
            {t(copy.title, { title: title ?? "" })}
          </Text>
        </View>

        <Text className="text-sm leading-5 text-fg-muted">{t(copy.message)}</Text>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="flex-row justify-end gap-3">
          <Button
            label={t("debtDetail.confirm.cancelAction")}
            variant="ghost"
            isDisabled={isSubmitting}
            onPress={onClose}
          />
          <Button
            label={t(copy.confirm)}
            variant="destructive"
            isLoading={isSubmitting}
            onPress={onConfirm}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
