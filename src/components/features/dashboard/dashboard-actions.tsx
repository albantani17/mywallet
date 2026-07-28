import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Fragment, type ComponentProps, type ReactNode } from "react";
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
 * The debts screen does not exist yet, so that tile stays inert rather than
 * linking to a route that would 404.
 */
export function DashboardActions() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const tile = (action: Action): ReactNode => (
    <Pressable
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
  );

  return (
    <View className="flex-row gap-3 px-6">
      {ACTIONS.map((action) =>
        action.key === "addTransaction" ? (
          <Link key={action.key} href="/transaction/new" asChild>
            {tile(action)}
          </Link>
        ) : (
          <Fragment key={action.key}>{tile(action)}</Fragment>
        ),
      )}
    </View>
  );
}
