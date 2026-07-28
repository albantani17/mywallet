import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type Action = {
  key: "addTransaction" | "debts";
  icon: ComponentProps<typeof Ionicons>["name"];
};

const ACTIONS: Action[] = [
  { key: "addTransaction", icon: "add-circle-outline" },
  { key: "debts", icon: "people-outline" },
];

/**
 * The two entry points below the wallet list.
 *
 * Neither destination screen exists yet, so these are inert rather than links
 * to a route that would 404.
 */
export function DashboardActions() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3 px-6">
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          className="flex-1 flex-col gap-3 rounded-3xl bg-surface p-5 active:opacity-70"
        >
          <View className="size-11 flex-col items-center justify-center rounded-2xl bg-primary-soft">
            <Ionicons name={action.icon} size={22} color={colors.primary} />
          </View>
          <Text className="text-sm font-semibold text-fg">
            {t(`dashboard.actions.${action.key}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
