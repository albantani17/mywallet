import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateWalletForm } from "./create-wallet-form";

/**
 * Blocking gate shown when no wallet exists yet.
 *
 * Rendered in place by the tabs layout rather than being a route it redirects
 * to. Redirecting unmounted the layout that owns the wallet live query, so
 * nothing was left watching for the new row and the app bounced straight back
 * here. Rendering in place keeps that query alive — the same mounted component
 * swaps itself for the tabs the moment the wallet lands. This mirrors how
 * onboarding renders inside src/app/index.tsx.
 */
export function CreateWalletScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 flex-col bg-base">
      <View className="absolute -right-16 -top-10 size-64 rounded-full bg-surface opacity-60" />

      <KeyboardAvoidingView
        className="flex-1"
        // Android relies on the default adjustResize behaviour.
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col px-6 pb-8">
            <Text className="text-[28px] font-extrabold leading-9 text-fg">
              {t("createWallet.title")}
            </Text>
            <Text className="mt-3 text-base leading-6 text-fg-muted">
              {t("createWallet.description")}
            </Text>
          </View>

          <View className="mx-6 flex-col rounded-3xl bg-surface p-6">
            <CreateWalletForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
