import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import type { DebtDirection } from "@/db";

import { DebtDirectionTabs } from "./debt-direction-tabs";
import { DebtList } from "./debt-list";
import { DebtTotalsHeader } from "./debt-totals-header";

/**
 * Debts in both directions: what the user owes, and what is owed to them.
 *
 * The direction tab is the only filter — settled debts stay in the list rather
 * than disappearing the moment they are paid off, since "did I ever pay that
 * back?" is exactly the question this screen answers.
 *
 * This is a tab root, so there is no back affordance: nothing sits underneath
 * it to pop to.
 */
export function DebtsScreen() {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<DebtDirection>("receivable");

  // The tab decides what the wizard starts as, so the user does not have to
  // say twice which side of the ledger they are on.
  const openNewDebt = useCallback(() => {
    router.push({ pathname: "/debts/new", params: { direction } });
  }, [direction]);

  return (
    // No `scrollable`: the FlatList does its own scrolling.
    <Screen title={t("debts.title")}>
      <View className="px-6 pb-4">
        <DebtDirectionTabs value={direction} onChange={setDirection} />
      </View>

      <DebtTotalsHeader direction={direction} />

      <DebtList direction={direction} />

      <View className="flex-col px-6 pb-6">
        <Button
          label={t(
            direction === "payable" ? "debts.addPayable" : "debts.addReceivable",
          )}
          onPress={openNewDebt}
        />
      </View>
    </Screen>
  );
}
