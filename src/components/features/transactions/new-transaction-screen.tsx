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

import { useThemeColors } from "@/hooks/use-theme-colors";

/**
 * Full-screen form for recording a transaction.
 *
 * Dismissal is an X in the top-left rather than a back chevron: this is a task
 * the user finishes or abandons, not a place they navigated into. It falls
 * back to /home because the route can be opened as the first entry (a deep
 * link, say), where there is no history to pop.
 */
export function NewTransactionScreen() {
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
    <View className="flex-1 flex-col bg-base">
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
        // Android relies on the default adjustResize behaviour.
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TransactionForm onSaved={close} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
