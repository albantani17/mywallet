import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { TransactionFilters } from "@/components/features/transactions/transaction-filters";
import { TransactionList } from "@/components/features/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useTransactionFilters } from "@/hooks/features/transactions/use-transaction-filters";

export default function TransactionsTab() {
  const { t } = useTranslation();
  // Held here rather than inside the list: the controls sit outside it, and
  // both need the same state.
  const filters = useTransactionFilters();

  return (
    // No `scrollable`: the SectionList does its own scrolling, and nesting it
    // in a ScrollView would break virtualisation.
    <Screen title={t("transactions.title")}>
      {/* Above the list, not in its ListHeaderComponent, so the search box and
          the filters stay put instead of scrolling away with the rows. */}
      <TransactionFilters
        search={filters.search}
        walletId={filters.walletId}
        range={filters.range}
        customFrom={filters.customFrom}
        customTo={filters.customTo}
        onSearchChange={filters.setSearch}
        onWalletChange={filters.setWalletId}
        onRangeChange={filters.setRange}
        onCustomFromChange={filters.setCustomFrom}
        onCustomToChange={filters.setCustomTo}
      />

      <TransactionList
        filters={filters.filters}
        isFiltered={filters.isFiltered}
      />

      {/* Pushed imperatively rather than with <Link asChild>: Button is a
          plain component, so cloning it with link props would be relying on
          props it does not declare. */}
      <View className="flex-col px-6 pb-6">
        <Button
          label={t("transactions.add")}
          onPress={() => router.push("/transaction/new")}
        />
      </View>
    </Screen>
  );
}
