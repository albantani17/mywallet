import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import type { TransactionWithRelations } from "@/db";
import { useDeleteTransaction } from "@/hooks/features/transactions/use-delete-transaction";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";

type TransactionDeleteSheetProps = {
  transaction: TransactionWithRelations;
  isOpen: boolean;
  onClose: () => void;
};

/** One confirmation at list level, rather than a Modal for every virtualised row. */
export function TransactionDeleteSheet({
  transaction,
  isOpen,
  onClose,
}: TransactionDeleteSheetProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();
  const { error, isSubmitting, remove } = useDeleteTransaction(onClose);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-red-100">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </View>
          <Text className="flex-1 text-lg font-bold text-fg">
            {t("transactions.delete.title")}
          </Text>
        </View>

        <Text className="text-sm leading-5 text-fg-muted">
          {t("transactions.delete.message")}
        </Text>

        <View className="flex-col gap-1 rounded-2xl bg-elevated px-4 py-3">
          <Text className="text-sm font-semibold text-fg" numberOfLines={1}>
            {transaction.walletName ?? t("transactions.uncategorized")}
          </Text>
          <Text className="text-base font-bold text-danger">
            {formatCurrency(
              transaction.amount,
              locale,
              transaction.walletCurrency ?? undefined,
            )}
          </Text>
          {transaction.note ? (
            <Text className="text-sm text-fg-muted" numberOfLines={2}>
              {transaction.note}
            </Text>
          ) : null}
        </View>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="mt-1 flex-row justify-end gap-3">
          <Button
            variant="ghost"
            label={t("transactions.actions.cancel")}
            isDisabled={isSubmitting}
            onPress={onClose}
          />
          <Button
            variant="destructive"
            label={t("transactions.actions.delete")}
            isLoading={isSubmitting}
            onPress={() => remove(transaction.id)}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
