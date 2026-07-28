import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";

import { TRANSACTION_TYPES, type TransactionType } from "@/db";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

type TransactionTypeTabsProps = {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
};

// Explicit records rather than templates: the i18n keys are typed, and Uniwind
// resolves classes from the literal text in the source.
const LABEL_KEYS = {
  expense: "newTransaction.types.expense",
  income: "newTransaction.types.income",
  transfer: "newTransaction.types.transfer",
  bill: "newTransaction.types.bill",
} as const;

const ICONS: Record<
  TransactionType,
  ComponentProps<typeof Ionicons>["name"]
> = {
  expense: "arrow-up-circle-outline",
  income: "arrow-down-circle-outline",
  transfer: "swap-horizontal-outline",
  bill: "receipt-outline",
};

// Spending first: it is by far the most common thing to record.
const ORDER: TransactionType[] = ["expense", "income", "transfer", "bill"];

/** The four transaction types as a horizontal row of chips. */
export function TransactionTypeTabs({
  value,
  onChange,
}: TransactionTypeTabsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  // Guards against a type being added to the schema and silently missing here.
  const types = ORDER.filter((type) => TRANSACTION_TYPES.includes(type));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
    >
      {types.map((type) => {
        const isActive = type === value;
        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(type)}
            className={cn(
              "flex-row items-center gap-1.5 self-start rounded-full border px-3.5 py-2",
              isActive
                ? "border-primary bg-primary"
                : "border-line bg-surface",
            )}
          >
            <Ionicons
              name={ICONS[type]}
              size={15}
              color={isActive ? colors.primaryFg : colors.fgMuted}
            />
            <Text
              className={cn(
                "text-xs font-semibold",
                isActive ? "text-fg" : "text-fg-muted",
              )}
            >
              {t(LABEL_KEYS[type])}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
