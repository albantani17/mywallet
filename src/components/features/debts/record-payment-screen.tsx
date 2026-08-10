import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDebt, useDebtSchedule } from "@/hooks/features/debts/use-debt";
import { useInstallments } from "@/hooks/features/debts/use-installments";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { dueBreakdown, summarise } from "@/services/debt-status";

import { RecordPaymentForm } from "./record-payment-form";

type RecordPaymentScreenProps = { debtId: number | null };

/**
 * Full-screen form for recording a repayment.
 *
 * Dismissal is an X rather than a back chevron: this is a task the user
 * finishes or abandons. It falls back to the debt's own screen, which is where
 * they came from and where the new payment will appear.
 */
export function RecordPaymentScreen({ debtId }: RecordPaymentScreenProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { debt, now, isReady, refreshKey } = useDebt(debtId);
  const { schedule, graceDays } = useDebtSchedule(debtId, refreshKey);
  const { installments } = useInstallments(debtId, refreshKey);

  const progress = useMemo(
    () => summarise(installments, { graceDays, now }),
    [graceDays, installments, now],
  );

  const due = useMemo(
    () => dueBreakdown(installments, { graceDays, now }),
    [graceDays, installments, now],
  );

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/debts");
  }, []);

  return (
    <View className="flex-1 flex-col bg-canvas">
      <View className="absolute -right-16 -top-10 size-64 rounded-full bg-surface opacity-60" />

      <View
        className="flex-row items-center gap-3 px-6 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("newPayment.close")}
          onPress={close}
          hitSlop={8}
          className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.fg} />
        </Pressable>

        <Text className="text-xl font-extrabold text-fg">
          {t("newPayment.title")}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        // Android needs an explicit behavior too — see the note in
        // new-transaction-screen.tsx.
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isReady ? (
            <View className="flex-col items-center py-16">
              <ActivityIndicator colorClassName="accent-fg" />
            </View>
          ) : !debt ? (
            <Text className="px-6 text-sm text-fg-muted">
              {t("newPayment.notFound")}
            </Text>
          ) : (
            <RecordPaymentForm
              debt={debt}
              installments={installments}
              progress={progress}
              due={due}
              installmentAmount={schedule?.installmentAmount ?? null}
              graceDays={graceDays}
              now={now}
              onSaved={close}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
