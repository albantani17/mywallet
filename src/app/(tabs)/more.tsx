import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Screen } from "@/components/ui/screen";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function MoreTab() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  return (
    <Screen title={t("more.title")} scrollable>
      <View className="flex-col gap-3 px-6">
        <Card>
          <Text className="text-xs font-medium text-fg-muted">
            {t("more.account")}
          </Text>
          <Text className="mt-1 text-lg font-bold text-fg">
            {user?.name ?? ""}
          </Text>
          <Text className="mt-0.5 text-xs text-fg-muted">
            {user?.email ?? t("more.guestAccount")}
          </Text>
        </Card>

        <View className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4">
          <Text className="text-base font-semibold text-fg">
            {t("more.theme")}
          </Text>
          <ThemeToggle />
        </View>

        <View className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4">
          <Text className="text-base font-semibold text-fg">
            {t("more.language")}
          </Text>
          <LanguageToggle />
        </View>

        {/* Pushed imperatively for the same reason as elsewhere: <Link asChild>
            would clone a Pressable with props it does not declare. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/backup")}
          className="flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4 active:opacity-70"
        >
          <Text className="text-base font-semibold text-fg">
            {t("backup.open")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.fgMuted} />
        </Pressable>
      </View>
    </Screen>
  );
}
