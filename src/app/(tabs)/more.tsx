import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Screen } from "@/components/ui/screen";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function MoreTab() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  return (
    <Screen title={t("more.title")} scrollable>
      <View className="flex-col gap-3 px-6">
        <Card>
          <Text className="text-xs font-medium text-brand-sheet-muted">
            {t("more.account")}
          </Text>
          <Text className="mt-1 text-lg font-bold text-brand-logo-fg">
            {user?.name ?? ""}
          </Text>
          <Text className="mt-0.5 text-xs text-brand-sheet-muted">
            {user?.email ?? t("more.guestAccount")}
          </Text>
        </Card>

        <View className="flex-row items-center justify-between rounded-3xl bg-white/10 px-5 py-4">
          <Text className="text-base font-semibold text-white">
            {t("more.language")}
          </Text>
          <LanguageToggle />
        </View>
      </View>
    </Screen>
  );
}
