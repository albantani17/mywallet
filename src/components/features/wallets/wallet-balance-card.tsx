import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";

type WalletBalanceCardProps = {
  /** Total across the currently visible wallets, not every wallet. */
  total: number;
};

export function WalletBalanceCard({ total }: WalletBalanceCardProps) {
  const { t } = useTranslation();
  // Tracked locale, not currentLocale() — otherwise the amount freezes when
  // the language changes.
  const { locale } = useActiveLocale();
  // Session-only: leaving the tab unmounts this and the balance shows again.
  const [isHidden, setIsHidden] = useState(false);

  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-brand-sheet px-5 py-4">
      <Text className="text-base font-semibold text-brand-logo-fg">
        {t("wallets.totalBalance")}
      </Text>

      <View className="flex-row items-center gap-3">
        <Text
          className="text-base font-extrabold text-brand-logo-fg"
          numberOfLines={1}
        >
          {isHidden ? "••••••" : formatCurrency(total, locale)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("wallets.toggleBalance")}
          accessibilityState={{ checked: !isHidden }}
          onPress={() => setIsHidden((previous) => !previous)}
          hitSlop={10}
        >
          <Ionicons
            name={isHidden ? "eye-off-outline" : "eye-outline"}
            size={18}
            color="#8a978c"
          />
        </Pressable>
      </View>
    </View>
  );
}
