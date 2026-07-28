import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { TINT_ALPHA } from "@/components/features/shared/icon-choices";
import { useWalletCategories } from "@/hooks/features/wallets/use-wallet-categories";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/utils/cn";

type WalletSelectProps = {
  label: string;
  value: number | null;
  onChange: (walletId: number) => void;
  /** Hidden from the list — the source wallet, when picking a destination. */
  excludeId?: number | null;
  error?: string | null;
  emptyLabel: string;
};

/**
 * Horizontal wallet chooser showing each wallet's live balance.
 *
 * A horizontal strip rather than a dropdown: the balance is the thing that
 * decides which wallet to spend from, so it has to be visible while choosing.
 */
export function WalletSelect({
  label,
  value,
  onChange,
  excludeId,
  error,
  emptyLabel,
}: WalletSelectProps) {
  const { locale } = useActiveLocale();
  const { wallets } = useWallets();
  const { resolve } = useWalletCategories();

  const options = wallets.filter((wallet) => wallet.id !== excludeId);

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-sm font-medium text-fg">{label}</Text>

      {options.length === 0 ? (
        <Text className="text-sm text-fg-muted">{emptyLabel}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {options.map((wallet) => {
            const isActive = wallet.id === value;
            const category = resolve(wallet.type);

            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => onChange(wallet.id)}
                className={cn(
                  "w-40 flex-col gap-2 rounded-2xl border p-3",
                  isActive
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-elevated",
                )}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="size-8 flex-col items-center justify-center rounded-xl"
                    style={{ backgroundColor: category.color + TINT_ALPHA }}
                  >
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={category.color}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="flex-1 text-sm font-semibold text-fg"
                  >
                    {wallet.name}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  className="text-xs text-fg-muted"
                >
                  {formatCurrency(wallet.balance, locale, wallet.currency)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
