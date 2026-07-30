import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDebts } from "@/hooks/features/debts/use-debts";

import { ReceivableRow } from "./receivable-row";

/** Money lent out, newest first, with the record button pinned below. */
export function ReceivableList() {
  const { t } = useTranslation();
  const { debts, isReady } = useDebts("receivable");

  // Computed once per render of the list so every row's overdue check agrees.
  const now = useMemo(() => new Date(), []);

  return (
    <View className="flex-1 flex-col">
      <FlatList
        data={debts}
        keyExtractor={(debt) => String(debt.id)}
        renderItem={({ item }) => <ReceivableRow debt={item} now={now} />}
        contentContainerClassName="flex-grow px-6 pb-4"
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        // Nothing until the first query resolves: an empty state that flashes
        // before the data lands reads as "you have no receivables".
        ListEmptyComponent={
          isReady ? (
            <EmptyState
              icon="people-outline"
              title={t("debts.emptyTitle")}
              description={t("debts.emptyDescription")}
            />
          ) : null
        }
      />

      <View className="flex-col px-6 pb-6">
        <Button
          label={t("debts.add")}
          onPress={() => router.push("/debts/new")}
        />
      </View>
    </View>
  );
}
