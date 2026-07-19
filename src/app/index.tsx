import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import Onboarding from "@/components/features/onboarding";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { setLocale, type AppLocale } from "@/i18n";

export default function Index() {
  const { t } = useTranslation();
  const { data, error, updatedAt } = useLiveQuery(
    db.select().from(usersTable).limit(1),
  );

  const user = data?.[0];

  // Selaraskan bahasa aplikasi dengan preferensi user yang tersimpan.
  useEffect(() => {
    if (user?.locale) {
      setLocale(user.locale as AppLocale);
    }
  }, [user?.locale]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-red-500">{error.message}</Text>
      </View>
    );
  }

  // `updatedAt` masih undefined sampai query pertama selesai — cegah kedip
  // onboarding untuk user yang sudah ada.
  if (updatedAt === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-canvas">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!user) {
    return <Onboarding />;
  }

  // Placeholder home sementara (dashboard belum dibuat).
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-2xl font-bold text-foreground">
        {t("home.greeting", { name: user.name })}
      </Text>
    </View>
  );
}
