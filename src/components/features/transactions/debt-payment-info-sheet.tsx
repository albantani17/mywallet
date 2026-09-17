import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/hooks/use-theme-colors";

type DebtPaymentInfoSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenDebt?: () => void;
};

/** Explains why repayment cash-flow cannot be deleted on its own. */
export function DebtPaymentInfoSheet({
  isOpen,
  onClose,
  onOpenDebt,
}: DebtPaymentInfoSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-elevated">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
          </View>
          <Text className="flex-1 text-lg font-bold text-fg">
            {t("transactions.delete.debtPaymentTitle")}
          </Text>
        </View>

        <Text className="text-sm leading-5 text-fg-muted">
          {t("transactions.delete.debtPaymentMessage")}
        </Text>

        <View className="mt-1 flex-row justify-end gap-3">
          <Button
            variant="ghost"
            label={t("transactions.actions.cancel")}
            onPress={onClose}
          />
          {onOpenDebt ? (
            <Button
              label={t("transactions.delete.openDebt")}
              onPress={onOpenDebt}
              className="px-6"
            />
          ) : null}
        </View>
      </View>
    </BottomSheet>
  );
}
