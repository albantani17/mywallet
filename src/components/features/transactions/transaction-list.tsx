import { useTranslation } from "react-i18next";
import { ActivityIndicator, SectionList, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import type { TransactionWithRelations } from "@/db";
import type { TransactionFilterValues } from "@/hooks/features/transactions/use-transaction-filters";
import { useTransactions } from "@/hooks/features/transactions/use-transactions";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { AppLocale } from "@/i18n";
import { formatDate, isSameDay, isToday, isYesterday } from "@/utils/format-date";

import { TransactionRow } from "./transaction-row";

type DaySection = {
  key: string;
  date: Date;
  data: TransactionWithRelations[];
};

/**
 * Folds an already-sorted list into one section per calendar day.
 *
 * The query orders by `occurredAt` descending, so same-day rows are always
 * adjacent and a single pass is enough — no grouping map, no re-sorting.
 */
function toSections(transactions: TransactionWithRelations[]): DaySection[] {
  const sections: DaySection[] = [];

  for (const transaction of transactions) {
    const last = sections[sections.length - 1];

    if (last && isSameDay(last.date, transaction.occurredAt)) {
      last.data.push(transaction);
      continue;
    }

    sections.push({
      key: transaction.occurredAt.toDateString(),
      date: transaction.occurredAt,
      data: [transaction],
    });
  }

  return sections;
}

function dayLabel(
  date: Date,
  now: Date,
  locale: AppLocale,
  t: (key: "transactions.today" | "transactions.yesterday") => string,
): string {
  if (isToday(date, now)) return t("transactions.today");
  if (isYesterday(date, now)) return t("transactions.yesterday");
  return formatDate(date, locale);
}

type TransactionListProps = {
  filters?: TransactionFilterValues;
  /** Switches the empty state between "none yet" and "nothing matched". */
  isFiltered?: boolean;
};

/** Transactions grouped under a header per day, newest first. */
export function TransactionList({
  filters,
  isFiltered = false,
}: TransactionListProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const { transactions, isReady, hasMore, loadMore, isRefreshing, refresh } =
    useTransactions(filters);

  if (!isReady) {
    return (
      <View className="flex-1 flex-col items-center justify-center">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  const sections = toSections(transactions);
  // One `now` for the whole render, so two headers can never disagree about
  // where today ends.
  const now = new Date();

  return (
    <SectionList<TransactionWithRelations, DaySection>
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <TransactionRow transaction={item} />}
      renderSectionHeader={({ section }) => (
        <View className="bg-canvas py-2">
          <Text className="text-xs font-semibold uppercase text-fg-muted">
            {dayLabel(section.date, now, locale, t)}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
      // The search box stays focused while the list is tapped or scrolled.
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <AppRefreshControl isRefreshing={isRefreshing} onRefresh={refresh} />
      }
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        hasMore ? (
          <View className="py-4">
            <ActivityIndicator colorClassName="accent-fg-muted" />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isFiltered ? (
          // Transactions exist, but the search or the filters excluded them.
          <EmptyState
            icon="search-outline"
            title={t("transactions.filters.noResultsTitle")}
            description={t("transactions.filters.noResultsDescription")}
          />
        ) : (
          <EmptyState
            icon="receipt-outline"
            title={t("transactions.emptyTitle")}
            description={t("transactions.emptyDescription")}
          />
        )
      }
    />
  );
}
