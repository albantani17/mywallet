import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { WalletType } from "@/db";
import { useWalletCategories } from "@/hooks/features/wallets/use-wallet-categories";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { toIconName } from "./wallet-type";

type WalletTypePickerProps = {
  value: WalletType;
  onChange: (type: WalletType) => void;
};

/**
 * Wallet category as a row of small badges, driven by the categories table so
 * user-created ones show up here too.
 *
 * Each badge sizes to its own content — no `flex-1` and no percentage
 * min-width, which is what made an earlier grid version collapse its options
 * onto one clipped row.
 */
export function WalletTypePicker({ value, onChange }: WalletTypePickerProps) {
  const colors = useThemeColors();
  const { categories, labelOf } = useWalletCategories();

  return (
    <View className="flex-row flex-wrap items-start gap-2">
      {categories.map((category) => {
        const isActive = category.slug === value;
        return (
          <Pressable
            key={category.slug}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(category.slug)}
            className={cn(
              "flex-row items-center gap-1.5 self-start rounded-full border px-3 py-1.5",
              isActive ? "bg-elevated" : "border-line bg-elevated",
            )}
            style={isActive ? { borderColor: category.color } : undefined}
          >
            <Ionicons
              name={toIconName(category.icon)}
              size={14}
              color={isActive ? category.color : colors.fgMuted}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: isActive ? category.color : colors.fgMuted }}
            >
              {labelOf(category)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
