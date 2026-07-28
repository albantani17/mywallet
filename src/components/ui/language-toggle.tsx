import { Pressable, Text, View } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import type { AppLocale } from "@/i18n";
import { userService } from "@/services/user-service";
import { cn } from "@/utils/cn";

const LOCALES: AppLocale[] = ["id", "en"];

/**
 * Pill toggle for switching the app language (ID / EN).
 *
 * Goes through the service rather than calling `setLocale` directly, so the
 * choice is written to the user row and survives a restart. During onboarding
 * there is no row yet — the update is a harmless no-op, and
 * `createGuestAccount` stamps whatever language is active at that point.
 */
export function LanguageToggle() {
  const { locale: active } = useActiveLocale();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface p-1">
      {LOCALES.map((locale) => {
        const isActive = active === locale;
        return (
          <Pressable
            key={locale}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              userService
                .changeLocale(locale)
                .catch((e) => console.error("Failed to change language", e));
            }}
            hitSlop={6}
            className={cn(
              "rounded-full px-3 py-1",
              isActive ? "bg-primary" : "bg-transparent",
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                // The active pill is a solid primary fill, so its label follows
                // the fill rather than the theme.
                isActive ? "text-primary-fg" : "text-fg-muted",
              )}
            >
              {locale.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
