import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 flex-col items-center justify-center px-10 py-16">
      <View className="mb-5 size-16 flex-col items-center justify-center rounded-full bg-white/10">
        <Ionicons name={icon} size={28} color="#9fb0a4" />
      </View>
      <Text className="text-center text-lg font-bold text-white">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-brand-muted">
        {description}
      </Text>
    </View>
  );
}
