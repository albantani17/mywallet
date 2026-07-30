import { useTranslation } from "react-i18next";
import { ActivityIndicator, SectionList, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import type { TransactionWithRelations } from "@/db";
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

/** Transactions grouped under a header per day, newest first. */
export function TransactionList() {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const { transactions, isReady, hasMore, loadMore, isRefreshing, refresh } =
    useTransactions();

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
        <EmptyState
          icon="receipt-outline"
          title={t("transactions.emptyTitle")}
          description={t("transactions.emptyDescription")}
        />
      }
    />
  );
}
