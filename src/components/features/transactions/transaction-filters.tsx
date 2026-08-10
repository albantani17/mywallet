import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SearchField } from "@/components/ui/search-field";
import type { TimeRange } from "@/hooks/features/transactions/use-transaction-filters";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { CategoryFilterChip } from "./category-filter-chip";
import { DateField } from "./date-field";

type TransactionFiltersProps = {
  search: string;
  walletId: number | null;
  /** Only ever set by a link in from elsewhere; cleared with the chip below. */
  categoryId: number | null;
  range: TimeRange;
  customFrom: Date | null;
  customTo: Date | null;
  onSearchChange: (value: string) => void;
  onWalletChange: (walletId: number | null) => void;
  onCategoryClear: () => void;
  onRangeChange: (range: TimeRange) => void;
  onCustomFromChange: (value: Date) => void;
  onCustomToChange: (value: Date) => void;
};

const RANGE_ORDER: TimeRange[] = [
  "all",
  "today",
  "last7",
  "last30",
  "thisMonth",
  "custom",
];

const RANGE_LABEL_KEYS = {
  all: "transactions.filters.allTime",
  today: "transactions.filters.today",
  last7: "transactions.filters.last7",
  last30: "transactions.filters.last30",
  thisMonth: "transactions.filters.thisMonth",
  custom: "transactions.filters.custom",
} as const;

/** The search box and the two narrowing controls above the transaction list. */
export function TransactionFilters({
  search,
  walletId,
  categoryId,
  range,
  customFrom,
  customTo,
  onSearchChange,
  onWalletChange,
  onCategoryClear,
  onRangeChange,
  onCustomFromChange,
  onCustomToChange,
}: TransactionFiltersProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { wallets } = useWallets();

  const activeWallet = wallets.find((wallet) => wallet.id === walletId);

  const walletItems = [
    {
      key: "all",
      label: t("transactions.filters.allWallets"),
      icon: "albums-outline" as const,
      onPress: () => onWalletChange(null),
    },
    ...wallets.map((wallet) => ({
      key: String(wallet.id),
      label: wallet.name,
      icon: "wallet-outline" as const,
      onPress: () => onWalletChange(wallet.id),
    })),
  ];

  const rangeItems = RANGE_ORDER.map((key) => ({
    key,
    label: t(RANGE_LABEL_KEYS[key]),
    onPress: () => onRangeChange(key),
  }));

  return (
    <View className="flex-col gap-3 px-6 pb-4">
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={t("transactions.filters.searchPlaceholder")}
        // Sits on the canvas rather than inside a panel, so it takes the panel
        // colour instead of the default control colour.
        className="bg-surface"
      />

      <View className="flex-row gap-2">
        {/* Both triggers are Views, not SelectFields: DropdownMenu owns the
            press and the measurement, so the trigger is presentation only. */}
        <View className="flex-1">
          <DropdownMenu
            items={walletItems}
            selectedKey={walletId === null ? "all" : String(walletId)}
            matchTriggerWidth
            accessibilityLabel={t("transactions.filters.wallet")}
            trigger={
              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={walletId === null ? colors.fgMuted : colors.primary}
                />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm font-medium text-fg"
                >
                  {activeWallet?.name ?? t("transactions.filters.allWallets")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.fgMuted}
                />
              </View>
            }
          />
        </View>

        <View className="flex-1">
          <DropdownMenu
            items={rangeItems}
            selectedKey={range}
            matchTriggerWidth
            accessibilityLabel={t("transactions.filters.time")}
            trigger={
              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={range === "all" ? colors.fgMuted : colors.primary}
                />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm font-medium text-fg"
                >
                  {t(RANGE_LABEL_KEYS[range])}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.fgMuted}
                />
              </View>
            }
          />
        </View>
      </View>

      {/* There is no category dropdown — this filter only ever arrives from a
          link, so it needs a way out rather than a way in. */}
      {categoryId !== null ? (
        <CategoryFilterChip categoryId={categoryId} onClear={onCategoryClear} />
      ) : null}

      {/* Rendered inline rather than inside a sheet: DateField opens a bottom
          sheet of its own, and stacking one sheet on another is a fight not
          worth picking. */}
      {range === "custom" ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <DateField
              label={t("transactions.filters.from")}
              value={customFrom}
              onChange={onCustomFromChange}
              placeholder={t("transactions.filters.anyDate")}
            />
          </View>
          <View className="flex-1">
            <DateField
              label={t("transactions.filters.to")}
              value={customTo}
              onChange={onCustomToChange}
              placeholder={t("transactions.filters.anyDate")}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
