import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TRANSACTION_TYPES, type TransactionType } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";

type TransactionTypeSelectProps = {
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

/**
 * The transaction type as a select with a dropdown.
 *
 * A field rather than a row of chips, so it lines up with the rest of the form
 * and leaves room for a fifth type later without the row starting to scroll.
 */
export function TransactionTypeSelect({
  value,
  onChange,
}: TransactionTypeSelectProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // Guards against a type being added to the schema and silently missing here.
  const types = ORDER.filter((type) => TRANSACTION_TYPES.includes(type));

  const items = types.map((type) => ({
    key: type,
    label: t(LABEL_KEYS[type]),
    icon: ICONS[type],
    onPress: () => onChange(type),
  }));

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-sm font-medium text-fg">
        {t("newTransaction.typeLabel")}
      </Text>

      <DropdownMenu
        items={items}
        selectedKey={value}
        matchTriggerWidth
        accessibilityLabel={t("newTransaction.typeLabel")}
        // DropdownMenu owns the press and the measurement, so the trigger is
        // presentation only — hence a View here rather than SelectField.
        trigger={
          <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-elevated px-4">
            <Ionicons name={ICONS[value]} size={18} color={colors.primary} />
            <Text className="flex-1 text-base text-fg">
              {t(LABEL_KEYS[value])}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.fgMuted} />
          </View>
        }
      />
    </View>
  );
}
