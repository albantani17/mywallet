import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TabTrigger } from "expo-router/ui";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarButton } from "./tab-bar-button";

/**
 * Custom navigation bar: 4 tabs + a center FAB. The FAB is not a tab — it
 * opens the add-transaction screen. TabTriggers here only need `name`
 * (their href is defined in <TabList> in the layout).
 */
export function AppTabBar() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="flex-row items-center justify-around border-t border-black/5 bg-brand-sheet"
      style={{ paddingBottom: insets.bottom + 6 }}
    >
      <TabTrigger name="home" asChild>
        <TabBarButton icon="home" label={t("tabs.home")} />
      </TabTrigger>
      <TabTrigger name="transactions" asChild>
        <TabBarButton icon="receipt-outline" label={t("tabs.transactions")} />
      </TabTrigger>

      {/* Center FAB — opens the add-transaction screen (not a tab). */}
      <Pressable
        onPress={() => router.push("/add-transaction")}
        className="-mt-6 size-14 items-center justify-center rounded-full bg-brand-primary"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <TabTrigger name="debts" asChild>
        <TabBarButton icon="swap-horizontal" label={t("tabs.debts")} />
      </TabTrigger>
      <TabTrigger name="settings" asChild>
        <TabBarButton icon="settings-sharp" label={t("tabs.settings")} />
      </TabTrigger>
    </View>
  );
}
