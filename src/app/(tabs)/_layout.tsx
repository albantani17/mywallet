import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";

import { AppTabBar } from "@/components/ui/app-tab-bar";

export default function TabLayout() {
  return (
    <Tabs>
      <TabSlot />

      {/* Our custom bar (4 tabs + center FAB). */}
      <AppTabBar />

      {/* Route definitions — hidden, config only. href is required here. */}
      <TabList style={{ display: "none" }}>
        <TabTrigger name="home" href="/home" />
        <TabTrigger name="transactions" href="/transactions" />
        <TabTrigger name="debts" href="/debts" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>
    </Tabs>
  );
}
