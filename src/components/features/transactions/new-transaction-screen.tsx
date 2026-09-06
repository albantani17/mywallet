import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TransactionForm } from "./transaction-form";

import type { TransactionDraft } from "@/hooks/features/transactions/use-create-transaction";
import { useThemeColors } from "@/hooks/use-theme-colors";

type NewTransactionScreenProps = {
  /** Pre-filled fields, e.g. from a long-pressed repeat chip. */
  initial?: Partial<TransactionDraft>;
};

/**
 * Full-screen form for recording a transaction.
 *
 * Dismissal is an X in the top-left rather than a back chevron: this is a task
 * the user finishes or abandons, not a place they navigated into. It falls
 * back to /home because the route can be opened as the first entry (a deep
 * link, say), where there is no history to pop.
 */
export function NewTransactionScreen({ initial }: NewTransactionScreenProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
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
          accessibilityLabel={t("newTransaction.close")}
          onPress={close}
          hitSlop={8}
          className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.fg} />
        </Pressable>

        <Text className="text-xl font-extrabold text-fg">
          {t("newTransaction.title")}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        // Android needs an explicit behavior too. Leaving it undefined makes
        // KeyboardAvoidingView render a plain View that does nothing, and the
        // adjustResize it used to lean on stopped working once SDK 57 made
        // edge-to-edge mandatory: the window is no longer resized for the IME.
        // Shrinking the container is what lets the ScrollView reach the last
        // field — the note — instead of leaving it under the keyboard.
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TransactionForm onSaved={close} initial={initial} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
