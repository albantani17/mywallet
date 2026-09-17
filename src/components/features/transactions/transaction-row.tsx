import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { TINT_ALPHA } from "@/components/features/shared/icon-choices";
import {
  DropdownMenu,
  type DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { TransactionWithRelations } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/utils/cn";

import {
  BUILT_IN_LABEL_KEYS,
  FALLBACK_COLOR,
  toIconName,
} from "./transaction-category";

type TransactionRowProps = {
  transaction: TransactionWithRelations;
  onDelete: (transaction: TransactionWithRelations) => void;
  onManageDebtPayment: (transaction: TransactionWithRelations) => void;
};

// A transfer has no category, so it borrows the type's own glyph.
const TRANSFER_ICON: ComponentProps<typeof Ionicons>["name"] =
  "swap-horizontal-outline";

// Full class strings per direction: Uniwind resolves classes from the literal
// text in the source, so these can never be assembled from fragments.
const AMOUNT_COLORS = {
  income: "text-primary",
  expense: "text-danger",
  bill: "text-danger",
  transfer: "text-fg",
} as const;

const AMOUNT_SIGNS = {
  income: "+",
  expense: "−",
  bill: "−",
  transfer: "",
} as const;

export function TransactionRow({
  transaction,
  onDelete,
  onManageDebtPayment,
}: TransactionRowProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const isTransfer = transaction.type === "transfer";

  // Built-ins keep their translated label; a category the user typed shows the
  // name they typed, in both languages. Same rule as the pickers.
  const builtInKey =
    transaction.categoryIsBuiltIn && transaction.categorySlug
      ? BUILT_IN_LABEL_KEYS[
          transaction.categorySlug as keyof typeof BUILT_IN_LABEL_KEYS
        ]
      : undefined;

  const title = isTransfer
    ? `${transaction.walletName ?? "?"} → ${transaction.toWalletName ?? "?"}`
    : (builtInKey ? t(builtInKey) : transaction.categoryName) ??
      t("transactions.uncategorized");

  // The wallet is already in the title of a transfer; showing it again is noise.
  const subtitle = [isTransfer ? null : transaction.walletName, transaction.note]
    .filter(Boolean)
    .join(" · ");

  const tint = isTransfer
    ? FALLBACK_COLOR
    : (transaction.categoryColor ?? FALLBACK_COLOR);

  const actions: DropdownMenuItem[] = transaction.isDebtPayment
    ? [
        {
          key: "manageDebtPayment",
          label: t("transactions.actions.manageDebtPayment"),
          icon: "information-circle-outline",
          onPress: () => onManageDebtPayment(transaction),
        },
      ]
    : [
        {
          key: "delete",
          label: t("transactions.actions.delete"),
          icon: "trash-outline",
          destructive: true,
          onPress: () => onDelete(transaction),
        },
      ];

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View
        className="size-10 flex-col items-center justify-center rounded-full"
        style={{ backgroundColor: tint + TINT_ALPHA }}
      >
        <Ionicons
          name={isTransfer ? TRANSFER_ICON : toIconName(transaction.categoryIcon)}
          size={18}
          color={tint}
        />
      </View>

      <View className="flex-1 flex-col">
        <Text className="text-base font-semibold text-fg" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-fg-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1">
        <Text
          className={cn(
            "text-base font-bold",
            AMOUNT_COLORS[transaction.type],
          )}
          numberOfLines={1}
        >
          {AMOUNT_SIGNS[transaction.type]}
          {formatCurrency(
            transaction.amount,
            locale,
            transaction.walletCurrency ?? undefined,
          )}
        </Text>

        <DropdownMenu
          items={actions}
          accessibilityLabel={t("transactions.actions.menuLabel")}
          trigger={
            <View className="size-8 flex-col items-center justify-center rounded-full">
              <Ionicons
                name="ellipsis-vertical"
                size={16}
                color={colors.fgMuted}
              />
            </View>
          }
        />
      </View>
    </View>
  );
}
