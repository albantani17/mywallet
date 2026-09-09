import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { QuickRepeatConfirmSheet } from "@/components/features/transactions/quick-repeat-confirm-sheet";
import { QuickRepeatStrip } from "@/components/features/transactions/quick-repeat-strip";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import { Screen } from "@/components/ui/screen";
import { useDashboardSummary } from "@/hooks/features/dashboard/use-dashboard-summary";
import { useInsights } from "@/hooks/features/dashboard/use-insights";
import { useQuickRepeat } from "@/hooks/features/transactions/use-quick-repeat";
import { useCurrentUser } from "@/hooks/use-current-user";

import { DashboardActions } from "./dashboard-actions";
import { InsightSection } from "./insight-section";
import { WalletCarousel } from "./wallet-carousel";

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const insights = useInsights();
  const { topWallets, hasMore, isReady, isRefreshing, refresh } =
    useDashboardSummary(insights.refresh);
  // Owned here rather than inside the strip: the confirm sheet is a Modal and
  // its state has to survive the strip unmounting when suggestions change.
  const quickRepeat = useQuickRepeat();

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
    <Screen
      scrollable
      refreshControl={
        <AppRefreshControl isRefreshing={isRefreshing} onRefresh={refresh} />
      }
      overlay={
        <QuickRepeatConfirmSheet
          pending={quickRepeat.confirming}
          isOpen={!!quickRepeat.confirming}
          isSubmitting={quickRepeat.isSubmitting}
          error={quickRepeat.error}
          onConfirm={quickRepeat.confirm}
          onClose={quickRepeat.cancel}
        />
      }
    >
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

        <QuickRepeatStrip onRepeat={quickRepeat.request} />

        <DashboardActions />

        <InsightSection insights={insights} />
      </View>
    </Screen>
  );
}
