import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { WalletWithBalance } from "@/db";
import { useWalletCategories } from "@/hooks/features/wallets/use-wallet-categories";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format-currency";

import { TINT_ALPHA } from "./wallet-type";

type WalletCardProps = {
  wallet: WalletWithBalance;
  className?: string;
};

export function WalletCard({ wallet, className }: WalletCardProps) {
  const { t } = useTranslation();
  // The locale must come from tracked state, not currentLocale(), or the
  // formatted balance freezes on a language switch.
  const { locale } = useActiveLocale();
  const { resolve } = useWalletCategories();

  // Falls back to a generic glyph if the wallet points at a missing category.
  const category = resolve(wallet.type);

  return (
    <View className={cn("flex-col rounded-3xl bg-brand-sheet p-5", className)}>
      <View className="flex-row items-center gap-3">
        <View
          className="size-10 flex-col items-center justify-center rounded-full"
          style={{ backgroundColor: category.color + TINT_ALPHA }}
        >
          <Ionicons name={category.icon} size={18} color={category.color} />
        </View>
        <View className="flex-1 flex-col">
          <Text className="text-base font-bold text-brand-logo-fg" numberOfLines={1}>
            {wallet.name}
          </Text>
          <Text className="text-xs text-brand-sheet-muted">
            {category.label}
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
