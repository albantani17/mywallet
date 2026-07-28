import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";

import type { WalletFilter } from "@/hooks/features/wallets/use-wallet-filters";
import { cn } from "@/utils/cn";

import { WALLET_TYPE_OPTIONS } from "./wallet-type";

type WalletTypeTabsProps = {
  value: WalletFilter;
  onChange: (filter: WalletFilter) => void;
};

/** "Semua" plus one chip per wallet type, scrollable when they overflow. */
export function WalletTypeTabs({ value, onChange }: WalletTypeTabsProps) {
  const { t } = useTranslation();

  const tabs: { key: WalletFilter; label: string }[] = [
    { key: "all", label: t("wallets.filterAll") },
    ...WALLET_TYPE_OPTIONS.map((option) => ({
      key: option.value as WalletFilter,
      label: t(`wallets.types.${option.labelKey}`),
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            className={cn(
              "flex-row items-center self-start rounded-full border px-3 py-1.5",
              isActive
                ? "border-brand-logo bg-brand-logo"
                : "border-white/15 bg-white/5",
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                isActive ? "text-brand-logo-fg" : "text-brand-muted",
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
