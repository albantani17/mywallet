import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import type { FrequentTransaction } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";

type PendingRepeat = {
  suggestion: FrequentTransaction;
  label: string;
};

type QuickRepeatConfirmSheetProps = {
  pending: PendingRepeat | null;
  isOpen: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Sits between a "Catat lagi" chip tap and the DB insert.
 *
 * The chip carries a full, valid transaction, so this sheet doubles as a
 * review: it shows the amount, wallet and name that are about to be recorded
 * before anything is written.
 */
export function QuickRepeatConfirmSheet({
  pending,
  isOpen,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: QuickRepeatConfirmSheetProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-elevated">
            <Ionicons name="repeat" size={20} color={colors.fg} />
          </View>
          <Text className="flex-1 text-xl font-bold text-fg">
            {t("dashboard.quickRepeat.confirm.title")}
          </Text>
        </View>

        {pending ? (
          <View className="flex-col gap-3 rounded-2xl border border-line bg-elevated p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xs text-fg-muted">
                {t("dashboard.quickRepeat.confirm.nameLabel")}
              </Text>
              <Text className="flex-1 text-right text-sm font-semibold text-fg">
                {pending.label}
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xs text-fg-muted">
                {t("dashboard.quickRepeat.confirm.amountLabel")}
              </Text>
              <Text className="flex-1 text-right text-base font-bold text-fg">
                {formatCurrency(pending.suggestion.amount, locale)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xs text-fg-muted">
                {t("dashboard.quickRepeat.confirm.walletLabel")}
              </Text>
              <Text className="flex-1 text-right text-sm font-semibold text-fg">
                {pending.suggestion.walletName ?? ""}
              </Text>
            </View>
          </View>
        ) : null}

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="flex-row justify-end gap-3">
          <Button
            label={t("dashboard.quickRepeat.confirm.cancel")}
            variant="ghost"
            isDisabled={isSubmitting}
            onPress={onClose}
          />
          <Button
            label={t("dashboard.quickRepeat.confirm.action")}
            variant="primary"
            isLoading={isSubmitting}
            onPress={onConfirm}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
