import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { WalletType } from "@/db";
import { cn } from "@/utils/cn";

import { WALLET_TYPE_OPTIONS } from "./wallet-type";

type WalletTypePickerProps = {
  value: WalletType;
  onChange: (type: WalletType) => void;
};

/**
 * Wallet type as a row of small badges.
 *
 * Each badge sizes to its own content — no `flex-1` and no percentage
 * min-width. The previous grid gave every option `flex-1` plus
 * `min-w-[47%]`, and when the arbitrary percentage did not resolve the four
 * options collapsed onto a single row with their labels clipped.
 */
export function WalletTypePicker({ value, onChange }: WalletTypePickerProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap items-start gap-2">
      {WALLET_TYPE_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-row items-center gap-1.5 self-start rounded-full border px-3 py-1.5",
              isActive
                ? "border-brand-primary bg-brand-primary/10"
                : "border-black/10 bg-white",
            )}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={isActive ? "#2f7d57" : "#8a978c"}
            />
            <Text
              className={cn(
                "text-xs font-semibold",
                isActive ? "text-brand-primary" : "text-brand-sheet-muted",
              )}
            >
              {t(`wallets.types.${option.labelKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
