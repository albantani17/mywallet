import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import type { DebtDirection } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { DebtDirectionTabs } from "./debt-direction-tabs";
import { ReceivableList } from "./receivable-list";

/**
 * Debts in both directions. Only "receivable" is built; the payable tab is a
 * placeholder so the split is visible from the start rather than appearing
 * later and moving everything around.
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

      {direction === "receivable" ? (
        <ReceivableList />
      ) : (
        <EmptyState
          icon="time-outline"
          title={t("debts.payableComingSoonTitle")}
          description={t("debts.payableComingSoonDescription")}
        />
      )}
    </Screen>
  );
}
