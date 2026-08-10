import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 flex-col items-center justify-center px-10 py-16">
      <View className="mb-5 size-16 flex-col items-center justify-center rounded-full bg-surface">
        <Ionicons name={icon} size={28} color={colors.fgMuted} />
      </View>
      <Text className="text-center text-lg font-bold text-fg">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-fg-muted">
        {description}
      </Text>
    </View>
  );
}
