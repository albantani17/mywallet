import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { Theme } from "@/db";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "@/utils/cn";

// Explicit records: the i18n keys are typed, so a template literal would not
// satisfy them.
const OPTIONS: {
  value: Theme;
  icon: ComponentProps<typeof Ionicons>["name"];
  labelKey: "more.themes.light" | "more.themes.dark" | "more.themes.system";
}[] = [
  { value: "light", icon: "sunny-outline", labelKey: "more.themes.light" },
  { value: "dark", icon: "moon-outline", labelKey: "more.themes.dark" },
  {
    value: "system",
    icon: "phone-portrait-outline",
    labelKey: "more.themes.system",
  },
];

/**
 * Pill toggle for the colour theme, mirroring LanguageToggle.
 *
 * Icons rather than words: three labels would not fit next to the row title,
 * and the accessibility label carries the meaning for screen readers.
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { preference, setPreference } = useActiveTheme();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface p-1">
      {OPTIONS.map((option) => {
        const isActive = preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={t(option.labelKey)}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              setPreference(option.value).catch((e) =>
                console.error("Failed to change the theme", e),
              );
            }}
            hitSlop={6}
            className={cn(
              "size-8 flex-col items-center justify-center rounded-full",
              isActive ? "bg-primary" : "bg-transparent",
            )}
          >
            <Ionicons
              name={option.icon}
              size={16}
              // The active pill is a solid primary fill, so its glyph follows
              // the fill rather than the theme.
              color={isActive ? colors.primaryFg : colors.fgMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
