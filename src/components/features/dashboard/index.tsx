import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { useDashboardSummary } from "@/hooks/features/dashboard/use-dashboard-summary";
import { useCurrentUser } from "@/hooks/use-current-user";

import { DashboardActions } from "./dashboard-actions";
import { WalletCarousel } from "./wallet-carousel";

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { topWallets, hasMore, isReady } = useDashboardSummary();

  if (!isReady) {
    return (
      <Screen>
        <View className="flex-1 flex-col items-center justify-center">
          <ActivityIndicator colorClassName="accent-fg" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View className="flex-col gap-8">
        <View className="flex-col gap-4">
          {/* No "see all" link here — the carousel's last slide is the way in
              once there are more wallets than it can show. */}
          <View className="flex-col px-6">
            <Text className="text-xs text-fg-muted">
              {t("dashboard.greeting", { name: user?.name ?? "" })}
            </Text>
            <Text className="mt-1 text-lg font-bold text-fg">
              {t("dashboard.yourWallets")}
            </Text>
          </View>

          <WalletCarousel wallets={topWallets} showMore={hasMore} />
        </View>

        <DashboardActions />
      </View>
    </Screen>
  );
}
