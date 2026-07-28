import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { WalletWithBalance } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format-currency";

import { WALLET_TYPE_ICONS } from "./wallet-type";

type WalletCardProps = {
  wallet: WalletWithBalance;
  className?: string;
};

export function WalletCard({ wallet, className }: WalletCardProps) {
  const { t } = useTranslation();
  // The locale must come from tracked state, not currentLocale(), or the
  // formatted balance freezes on a language switch.
  const { locale } = useActiveLocale();

  return (
    <View className={cn("flex-col rounded-3xl bg-brand-sheet p-5", className)}>
      <View className="flex-row items-center gap-3">
        <View className="size-10 flex-col items-center justify-center rounded-full bg-brand-primary/15">
          <Ionicons
            name={WALLET_TYPE_ICONS[wallet.type]}
            size={18}
            color="#2f7d57"
          />
        </View>
        <View className="flex-1 flex-col">
          <Text className="text-base font-bold text-brand-logo-fg" numberOfLines={1}>
            {wallet.name}
          </Text>
          <Text className="text-xs text-brand-sheet-muted">
            {t(`wallets.types.${wallet.type}`)}
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-xs font-medium text-brand-sheet-muted">
        {t("wallets.balance")}
      </Text>
      <Text
        className="mt-1 text-2xl font-extrabold text-brand-logo-fg"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(Number(wallet.balance), locale, wallet.currency)}
      </Text>
    </View>
  );
}
