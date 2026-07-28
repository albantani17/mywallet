import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { db } from "@/db";
import migrations from "../../drizzle/migrations";

import "../global.css";
import "@/i18n";

export default function RootLayout() {
  const { t } = useTranslation();
  // Applies any pending migration before the app renders; the database is not
  // usable until `success` flips.
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-brand-canvas p-6">
        <Text className="text-center text-red-400">
          {t("common.migrationFailed")}: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-brand-canvas">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#2e3d33" },
        }}
      />
    </>
  );
}
