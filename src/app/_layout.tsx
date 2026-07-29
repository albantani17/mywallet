import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { BUILT_IN_TRANSACTION_CATEGORY_SEEDS } from "@/components/features/transactions/transaction-category";
import { BUILT_IN_CATEGORY_SEEDS } from "@/components/features/wallets/wallet-type";
import { db } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { categoryService } from "@/services/category-service";
import { walletCategoryService } from "@/services/wallet-category-service";
import migrations from "../../drizzle/migrations";

import "../global.css";
import "@/i18n";

export default function RootLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  // Applies any pending migration before the app renders; the database is not
  // usable until `success` flips.
  const { success, error } = useMigrations(db, migrations);
  const [isSeeded, setIsSeeded] = useState(false);

  // Inserts the built-in wallet and transaction categories once the tables
  // exist. Idempotent, so it is also what backfills a device that upgraded
  // from before those columns existed. A failure must not block the app — the
  // category resolvers fall back to a generic icon — so this settles either
  // way, and the two seeds are independent enough that one failing should not
  // discard the other.
  useEffect(() => {
    if (!success) return;

    let isCurrent = true;
    Promise.all([
      walletCategoryService
        .ensureBuiltIns(BUILT_IN_CATEGORY_SEEDS)
        .catch((e) => console.error("Failed to seed wallet categories", e)),
      categoryService
        .ensureBuiltIns(BUILT_IN_TRANSACTION_CATEGORY_SEEDS)
        .catch((e) => console.error("Failed to seed transaction categories", e)),
    ])
      .finally(() => {
        if (isCurrent) setIsSeeded(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [success]);

  if (error) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-base p-6">
        <Text className="text-center text-danger">
          {t("common.migrationFailed")}: {error.message}
        </Text>
      </View>
    );
  }

  // Also waits on the seed, so the category tabs never render empty.
  if (!success || !isSeeded) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-base">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  return (
    <>
      {/* "auto" follows the OS colour scheme, and Uniwind.setTheme pushes the
          chosen theme into Appearance — so an explicit theme drives this too. */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.base },
        }}
      />
    </>
  );
}
