import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useMainFunds } from "@/hooks/features/wallets/use-main-funds";
import { useWalletCategories } from "@/hooks/features/wallets/use-wallet-categories";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";

import { TINT_ALPHA } from "./wallet-type";

type MainFundSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Every active wallet with a checkbox: ticked wallets are the money insights
 * and the daily allowance are worked out from. Savings and investments can be
 * unticked so they stop counting as spendable.
 */
export function MainFundSheet({ isOpen, onClose }: MainFundSheetProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();
  const { resolve } = useWalletCategories();
  const { wallets, mainTotal, pendingId, hasError, toggle } = useMainFunds();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-4">
        <View className="flex-col gap-1">
          <Text className="text-xl font-bold text-fg">
            {t("wallets.mainFund.title")}
          </Text>
          <Text className="text-xs leading-4 text-fg-muted">
            {t("wallets.mainFund.description")}
          </Text>
        </View>

        <View className="flex-col gap-2">
          {wallets.map((wallet) => {
            const category = resolve(wallet.type);
            const isPending = pendingId === wallet.id;

            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: wallet.isMainFund,
                  busy: isPending,
                }}
                disabled={pendingId !== null}
                onPress={() => toggle(wallet.id, !wallet.isMainFund)}
                className="flex-row items-center gap-3 rounded-2xl bg-elevated p-3 active:opacity-70"
              >
                <View
                  className="size-9 flex-col items-center justify-center rounded-xl"
                  style={{ backgroundColor: category.color + TINT_ALPHA }}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={category.color}
                  />
                </View>

                <View className="flex-1 flex-col">
                  <Text
                    className="text-sm font-medium text-fg"
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                  <Text className="text-xs text-fg-muted" numberOfLines={1}>
                    {formatCurrency(
                      Number(wallet.balance),
                      locale,
                      wallet.currency,
                    )}
                  </Text>
                </View>

                {isPending ? (
                  <ActivityIndicator colorClassName="accent-fg-muted" />
                ) : (
                  <Ionicons
                    name={wallet.isMainFund ? "checkbox" : "square-outline"}
                    size={22}
                    color={wallet.isMainFund ? colors.primary : colors.fgMuted}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-surface px-1">
          <Text className="text-sm text-fg-muted">
            {t("wallets.mainFund.total")}
          </Text>
          <Text className="text-base font-extrabold text-fg">
            {formatCurrency(mainTotal, locale)}
          </Text>
        </View>

        {hasError ? (
          <Text className="text-sm text-danger">
            {t("wallets.mainFund.failed")}
          </Text>
        ) : null}

        <View className="flex-row justify-end">
          <Button
            label={t("wallets.mainFund.done")}
            onPress={onClose}
            className="px-7"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
