import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";

export default function TransactionsTab() {
  const { t } = useTranslation();

  return (
    <Screen title={t("transactions.title")}>
      <EmptyState
        icon="receipt-outline"
        title={t("transactions.emptyTitle")}
        description={t("transactions.emptyDescription")}
      />

      {/* Pushed imperatively rather than with <Link asChild>: Button is a
          plain component, so cloning it with link props would be relying on
          props it does not declare. */}
      <View className="flex-col px-6 pb-6">
        <Button
          label={t("transactions.add")}
          onPress={() => router.push("/transaction/new")}
        />
      </View>
    </Screen>
  );
}
