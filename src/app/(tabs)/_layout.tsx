import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View, type ColorValue } from "react-native";

import { CreateWalletScreen } from "@/components/features/wallets/create-wallet-screen";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { useThemeColors } from "@/hooks/use-theme-colors";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  home: { active: "home", inactive: "home-outline" },
  wallets: { active: "wallet", inactive: "wallet-outline" },
  transactions: { active: "swap-vertical", inactive: "swap-vertical-outline" },
  budget: { active: "pie-chart", inactive: "pie-chart-outline" },
  more: {
    active: "ellipsis-horizontal",
    inactive: "ellipsis-horizontal-outline",
  },
};

function tabIcon(name: keyof typeof ICONS) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons
      name={focused ? ICONS[name].active : ICONS[name].inactive}
      size={22}
      color={color as string}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { wallets, isReady } = useWallets();

  if (!isReady) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-canvas">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  // Rendered in place, not redirected to: this component owns the wallet live
  // query, so it stays mounted and swaps itself for the tabs as soon as the
  // first wallet is inserted. No tab screen ever sees a zero-wallet state.
  if (wallets.length === 0) {
    return <CreateWalletScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.fgMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t("tabs.home"), tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="wallets"
        options={{ title: t("tabs.wallets"), tabBarIcon: tabIcon("wallets") }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: tabIcon("transactions"),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{ title: t("tabs.budget"), tabBarIcon: tabIcon("budget") }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t("tabs.more"), tabBarIcon: tabIcon("more") }}
      />
    </Tabs>
  );
}
