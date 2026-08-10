import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type SelectFieldProps = {
  label: string;
  /** Rendered inside the box. Omit to show `placeholder` instead. */
  children?: ReactNode;
  placeholder?: string;
  error?: string | null;
  onPress: () => void;
  /** Swap the chevron for something else — a calendar, say. */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

/**
 * A field that opens something instead of taking typed input.
 *
 * Shares TextField's box so a form reads as one column of controls whether a
 * row is typed into, picked from a dropdown, or picked from a sheet. The
 * trigger is a Pressable rather than a disabled TextInput, which keeps the
 * keyboard away and leaves the row reachable by a screen reader as a button.
 */
export function SelectField({
  label,
  children,
  placeholder,
  error,
  onPress,
  icon = "chevron-down",
}: SelectFieldProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-sm font-medium text-fg">{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="h-12 flex-row items-center justify-between gap-2 rounded-xl border border-line bg-elevated px-4 active:opacity-70"
      >
        {children ?? (
          <Text className="flex-1 text-base text-fg-muted">
            {placeholder ?? ""}
          </Text>
        )}
        <Ionicons name={icon} size={18} color={colors.fgMuted} />
      </Pressable>

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
