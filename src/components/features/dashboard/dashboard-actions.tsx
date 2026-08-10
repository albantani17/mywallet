import { Ionicons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type Action = {
  key: "addTransaction";
  icon: ComponentProps<typeof Ionicons>["name"];
  href: Href;
};

// Debts used to sit here too; it has its own tab now, and a second way in from
// the same screen only makes the tab bar look like it is missing something.
const ACTIONS: Action[] = [
  { key: "addTransaction", icon: "add-circle-outline", href: "/transaction/new" },
];

/** The way into recording a transaction, below the wallet list. */
export function DashboardActions() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3 px-6">
      {ACTIONS.map((action) => (
        <Link key={action.key} href={action.href} asChild>
          {/* Laid out as a row: stacking the icon above the label made these
              tiles twice as tall as they needed to be. */}
          <Pressable
            accessibilityRole="button"
            className="flex-1 flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 active:opacity-70"
          >
            <View className="size-9 flex-col items-center justify-center rounded-xl bg-primary-soft">
              <Ionicons name={action.icon} size={18} color={colors.primary} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-fg">
              {t(`dashboard.actions.${action.key}`)}
            </Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
