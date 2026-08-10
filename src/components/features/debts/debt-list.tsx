import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import type { DebtDirection, DebtWithSummary } from "@/db";
import { useDebts } from "@/hooks/features/debts/use-debts";

import { DebtRow } from "./debt-row";

type DebtListProps = { direction: DebtDirection };

/** The debts in one direction, open and closed both. */
export function DebtList({ direction }: DebtListProps) {
  const { t } = useTranslation();
  const { debts, isReady, isRefreshing, refresh } = useDebts(direction);

  return (
    // The wrapper is what bounds the list: without it a long list grows past
    // the screen and pushes the add button below the fold.
    <View className="flex-1 flex-col">
      <FlatList
        data={debts}
        keyExtractor={(debt: DebtWithSummary) => String(debt.id)}
        renderItem={({ item }) => <DebtRow debt={item} />}
        contentContainerClassName="flex-grow px-6 pb-4"
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <AppRefreshControl isRefreshing={isRefreshing} onRefresh={refresh} />
        }
        // Withheld until the first query resolves, so the empty state does not
        // flash on top of debts that are about to arrive.
        ListEmptyComponent={
          isReady ? (
            <EmptyState
              icon={
                direction === "payable" ? "wallet-outline" : "people-outline"
              }
              title={t(
                direction === "payable"
                  ? "debts.emptyPayableTitle"
                  : "debts.emptyReceivableTitle",
              )}
              description={t(
                direction === "payable"
                  ? "debts.emptyPayableDescription"
                  : "debts.emptyReceivableDescription",
              )}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
