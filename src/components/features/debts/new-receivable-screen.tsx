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

import { useThemeColors } from "@/hooks/use-theme-colors";

import { ReceivableForm } from "./receivable-form";

/**
 * Full-screen form for lending money out.
 *
 * Framed exactly like the new-transaction screen: an X in the top-left rather
 * than a back chevron, because this is a task the user finishes or abandons.
 */
export function NewReceivableScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
          accessibilityLabel={t("newReceivable.close")}
          onPress={close}
          hitSlop={8}
          className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.fg} />
        </Pressable>

        <Text className="text-xl font-extrabold text-fg">
          {t("newReceivable.title")}
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
          <ReceivableForm onSaved={close} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
