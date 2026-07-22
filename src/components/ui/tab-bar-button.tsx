import { Ionicons } from "@expo/vector-icons";
import type { TabTriggerSlotProps } from "expo-router/ui";
import type { ComponentProps, Ref } from "react";
import { Pressable, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type TabBarButtonProps = TabTriggerSlotProps & {
  icon: IoniconName;
  label: string;
  ref?: Ref<View>;
};

export function TabBarButton({
  icon,
  label,
  isFocused,
  ref,
  ...props
}: TabBarButtonProps) {
  const color = isFocused ? "#2f7d57" : "#8a978c";

  return (
    <Pressable
      ref={ref}
      {...props}
      style={{
        flex: 1,
        alignItems: "center",
        gap: 4,
        padding: 5,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-[10px] font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
