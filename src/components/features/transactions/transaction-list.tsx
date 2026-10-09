import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, SectionList, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import type { TransactionWithRelations } from "@/db";
import {
  useDailyTotals,
  type DayTotals,
} from "@/hooks/features/transactions/use-daily-totals";
import type { TransactionFilterValues } from "@/hooks/features/transactions/use-transaction-filters";
import { useTransactions } from "@/hooks/features/transactions/use-transactions";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { AppLocale } from "@/i18n";
import { formatCompactCurrency } from "@/utils/format-currency";
import {
  formatDate,
  isSameDay,
  isToday,
  isYesterday,
  toDayKey,
} from "@/utils/format-date";

import { TransactionRow } from "./transaction-row";
import { DebtPaymentInfoSheet } from "./debt-payment-info-sheet";
import { TransactionDeleteSheet } from "./transaction-delete-sheet";

type DaySection = {
  /** `toDayKey` of the day — also what the day's totals are looked up by. */
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
      key: toDayKey(transaction.occurredAt),
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

/**
 * The day's money in and out, beside its label. A side with nothing in it is
 * left out rather than shown as "+Rp0", which is noise on most days.
 */
function DayTotalsLabel({
  totals,
  locale,
}: {
  totals: DayTotals | undefined;
  locale: AppLocale;
}) {
  if (!totals) return null;

  return (
    <View className="flex-row items-center gap-2">
      {totals.income > 0 ? (
        <Text className="text-xs font-semibold text-primary">
          +{formatCompactCurrency(totals.income, locale)}
        </Text>
      ) : null}
      {totals.expense > 0 ? (
        <Text className="text-xs font-semibold text-danger">
          −{formatCompactCurrency(totals.expense, locale)}
        </Text>
      ) : null}
    </View>
  );
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
  const dailyTotals = useDailyTotals(filters);
  const [transactionToDelete, setTransactionToDelete] =
    useState<TransactionWithRelations | null>(null);
  const [debtPayment, setDebtPayment] =
    useState<TransactionWithRelations | null>(null);

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
    <>
      <SectionList<TransactionWithRelations, DaySection>
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onDelete={setTransactionToDelete}
            onManageDebtPayment={setDebtPayment}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center justify-between bg-canvas py-2">
            <Text className="text-xs font-semibold uppercase text-fg-muted">
              {dayLabel(section.date, now, locale, t)}
            </Text>
            <DayTotalsLabel
              totals={dailyTotals.get(section.key)}
              locale={locale}
            />
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

      {transactionToDelete ? (
        <TransactionDeleteSheet
          key={transactionToDelete.id}
          transaction={transactionToDelete}
          isOpen
          onClose={() => setTransactionToDelete(null)}
        />
      ) : null}

      {debtPayment ? (
        <DebtPaymentInfoSheet
          isOpen
          onClose={() => setDebtPayment(null)}
          onOpenDebt={
            debtPayment.debtId === null
              ? undefined
              : () => {
                  const debtId = debtPayment.debtId;
                  setDebtPayment(null);
                  router.push(`/debts/${debtId}`);
                }
          }
        />
      ) : null}
    </>
  );
}
