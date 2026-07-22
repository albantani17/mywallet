import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentUser } from "@/hooks/use-current-user";

import { QuickActions } from "./quick-actions";
import { TotalAssetsCard } from "./total-assets-card";

/**
 * Bagian atas beranda (kartu hijau full-width): sapaan, Total Aset, dan aksi
 * cepat. Menangani safe-area atas sendiri agar bisa menempel di tepi layar.
 */
export const Dashboard = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useCurrentUser();

  return (
    <View
      className="rounded-b-3xl bg-brand-canvas px-6 pb-6"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Sapaan + badge logo (menyamai onboarding) */}
      <View className="mb-6 flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-2xl bg-brand-logo">
          <Text className="text-lg font-extrabold text-brand-logo-fg">S</Text>
        </View>
        <Text className="text-base font-semibold text-white">
          {t("home.greeting", { name: user?.name ?? "" })}
        </Text>
      </View>

      <TotalAssetsCard />
      <QuickActions />
    </View>
  );
};
