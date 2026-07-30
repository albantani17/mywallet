import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { DebtDirection } from "@/db";
import { cn } from "@/utils/cn";

type DebtDirectionTabsProps = {
  value: DebtDirection;
  onChange: (direction: DebtDirection) => void;
};

const DIRECTIONS: DebtDirection[] = ["receivable", "payable"];

/** Piutang / Hutang switch, same chip language as the wallet filters. */
export function DebtDirectionTabs({ value, onChange }: DebtDirectionTabsProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2">
      {DIRECTIONS.map((direction) => {
        const isActive = direction === value;
        return (
          <Pressable
            key={direction}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(direction)}
            className={cn(
              "flex-1 flex-row items-center justify-center rounded-full border px-3 py-2",
              isActive ? "border-primary bg-primary" : "border-line bg-surface",
            )}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                // The active chip sits on a solid fill, so its label follows
                // the fill rather than the theme.
                isActive ? "text-primary-fg" : "text-fg-muted",
              )}
            >
              {t(`debts.tabs.${direction}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
