import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { TransactionFilters } from "@/components/features/transactions/transaction-filters";
import { TransactionList } from "@/components/features/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useTransactionFilters } from "@/hooks/features/transactions/use-transaction-filters";

/** A numeric route param, or null when absent or malformed. */
function numberParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function TransactionsTab() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    categoryId?: string;
    from?: string;
    to?: string;
  }>();

  // Recomputed every render, but only *applied* when the params themselves
  // change — a tab screen stays mounted, so arriving a second time with a
  // different category has to land.
  const initial = useMemo(() => {
    const from = numberParam(params.from);
    const to = numberParam(params.to);

    return {
      categoryId: numberParam(params.categoryId),
      from: from === null ? null : new Date(from),
      to: to === null ? null : new Date(to),
    };
  }, [params.categoryId, params.from, params.to]);

  // Held here rather than inside the list: the controls sit outside it, and
  // both need the same state.
  const filters = useTransactionFilters(initial);

  return (
    // No `scrollable`: the SectionList does its own scrolling, and nesting it
    // in a ScrollView would break virtualisation.
    <Screen title={t("transactions.title")}>
      {/* Above the list, not in its ListHeaderComponent, so the search box and
          the filters stay put instead of scrolling away with the rows. */}
      <TransactionFilters
        search={filters.search}
        walletId={filters.walletId}
        categoryId={filters.categoryId}
        range={filters.range}
        customFrom={filters.customFrom}
        customTo={filters.customTo}
        onSearchChange={filters.setSearch}
        onWalletChange={filters.setWalletId}
        onCategoryClear={() => filters.setCategoryId(null)}
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
