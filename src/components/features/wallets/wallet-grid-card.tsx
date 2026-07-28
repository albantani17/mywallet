import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { WalletWithBalance } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";

import { WalletCardMenu } from "./wallet-card-menu";
import { TINT_ALPHA, WALLET_TYPE_COLORS, WALLET_TYPE_ICONS } from "./wallet-type";

type WalletGridCardProps = {
  wallet: WalletWithBalance;
  onEdit: (wallet: WalletWithBalance) => void;
  onDelete: (wallet: WalletWithBalance) => void;
};

/** Compact card for the two-column grid: logo and kebab, then name and balance. */
export function WalletGridCard({
  wallet,
  onEdit,
  onDelete,
}: WalletGridCardProps) {
  const { t } = useTranslation();
  // Tracked locale, not currentLocale() — otherwise the amount freezes when
  // the language changes.
  const { locale } = useActiveLocale();

  const accent = WALLET_TYPE_COLORS[wallet.type];

  return (
    <View className="flex-1 flex-col rounded-2xl bg-brand-sheet p-3.5">
      <View className="flex-row items-start justify-between">
        <View
          className="size-11 flex-col items-center justify-center rounded-2xl"
          style={{ backgroundColor: accent + TINT_ALPHA }}
        >
          <Ionicons
            name={WALLET_TYPE_ICONS[wallet.type]}
            size={22}
            color={accent}
          />
        </View>

        <WalletCardMenu
          wallet={wallet}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>

      {/* Amount above the type label: the balance is what gets scanned for. */}
      <Text
        className="mt-3 text-sm font-bold text-brand-logo-fg"
        numberOfLines={1}
      >
        {wallet.name}
      </Text>

      <Text
        className="mt-1 text-base font-extrabold text-brand-logo-fg"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(Number(wallet.balance), locale, wallet.currency)}
      </Text>

      <Text className="mt-0.5 text-[11px]" style={{ color: accent }}>
        {t(`wallets.types.${wallet.type}`)}
      </Text>
    </View>
  );
}
