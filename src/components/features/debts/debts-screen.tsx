import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import type { DebtDirection } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { DebtDirectionTabs } from "./debt-direction-tabs";
import { DebtList } from "./debt-list";
import { DebtTotalsHeader } from "./debt-totals-header";

/**
 * Debts in both directions: what the user owes, and what is owed to them.
 *
 * The tab is the only filter — settled debts stay in the list rather than
 * disappearing the moment they are paid off, since "did I ever pay that back?"
 * is exactly the question this screen answers.
 *
 * Back falls through to /home because this route can be the first entry (a
 * deep link, say), where there is no history to pop.
 */
export function DebtsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [direction, setDirection] = useState<DebtDirection>("receivable");

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
  }, []);

  // The tab decides what the wizard starts as, so the user does not have to
  // say twice which side of the ledger they are on.
  const openNewDebt = useCallback(() => {
    router.push({ pathname: "/debts/new", params: { direction } });
  }, [direction]);

  return (
    // No `scrollable`: the FlatList does its own scrolling.
    <Screen>
      <View className="flex-row items-center gap-3 px-6 pb-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("debts.back")}
          onPress={goBack}
          hitSlop={8}
          className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.fg} />
        </Pressable>

        <Text className="flex-1 text-2xl font-extrabold text-fg">
          {t("debts.title")}
        </Text>
      </View>

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
