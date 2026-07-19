import { Stack } from "expo-router";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { HeroUINativeProvider } from "heroui-native";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { db } from "@/db";
import migrations from "../../drizzle/migrations";
import "../global.css";
import "@/i18n";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        {error ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-red-500">
              Migration error: {error.message}
            </Text>
          </View>
        ) : !success ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <Stack />
        )}
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
