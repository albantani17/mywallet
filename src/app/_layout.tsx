import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type Theme,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View, useColorScheme } from "react-native";

import { db } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { googleAuthService } from "@/services/google-auth-service";
import { seedService } from "@/services/seed-service";
import migrations from "../../drizzle/migrations";

import "../global.css";
import "@/i18n";

/**
 * The navigators' own palette, built from the same tokens as the rest of the
 * app.
 *
 * Without this, React Navigation falls back to its DefaultTheme, whose
 * background is rgb(242, 242, 242) — and that surface is what a screen slides
 * across during a transition. In dark mode it reads as a white panel sweeping
 * over the app, because only the screens themselves were ever themed.
 */
function navigationTheme(
  isDark: boolean,
  colors: ReturnType<typeof useThemeColors>,
): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.canvas,
      card: colors.surface,
      text: colors.fg,
      border: colors.line,
      primary: colors.primary,
    },
  };
}

export default function RootLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  // Uniwind.setTheme pushes the chosen theme into Appearance (see
  // user-service.applyUserPreferences), so this follows an explicit in-app
  // choice, not just the OS setting.
  const isDark = useColorScheme() === "dark";
  // Applies any pending migration before the app renders; the database is not
  // usable until `success` flips.
  const { success, error } = useMigrations(db, migrations);
  const [isSeeded, setIsSeeded] = useState(false);

  // Inserts the built-in categories and debt presets once the tables exist.
  // See seedService.ensureBuiltIns — it settles either way, so a failure here
  // cannot keep the app on the spinner.
  useEffect(() => {
    if (!success) return;

    let isCurrent = true;
    seedService.ensureBuiltIns().finally(() => {
      if (isCurrent) setIsSeeded(true);
    });

    return () => {
      isCurrent = false;
    };
  }, [success]);

  // Google Sign-In has to be configured before any call into it, and the
  // Backup screen can be reached at any moment. Cheap, and a no-op when no
  // client id is set in the app config.
  useEffect(() => {
    googleAuthService.configure();
  }, []);

  /**
   * Paints the native window behind the whole React tree.
   *
   * This is the bottom-most surface — below the navigators, below every
   * screen — and it defaults to white. A native stack animation lifts the
   * screens off it briefly, which is exactly when a white edge shows through
   * in dark mode. Re-runs on a theme change so the toggle takes effect at once.
   */
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.canvas).catch((e) =>
      console.error("Failed to set the window background", e),
    );
  }, [colors.canvas]);

  if (error) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-canvas p-6">
        <Text className="text-center text-danger">
          {t("common.migrationFailed")}: {error.message}
        </Text>
      </View>
    );
  }

  // Also waits on the seed, so the category tabs never render empty.
  if (!success || !isSeeded) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-canvas">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme(isDark, colors)}>
      {/* "auto" follows the OS colour scheme, and Uniwind.setTheme pushes the
          chosen theme into Appearance — so an explicit theme drives this too. */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.canvas },
        }}
      />
    </ThemeProvider>
  );
}
