import { Pressable, Text, View } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import type { AppLocale } from "@/i18n";
import { cn } from "@/utils/cn";

const LOCALES: AppLocale[] = ["id", "en"];

/** Pill toggle for switching the app language (ID / EN). */
export function LanguageToggle() {
  const { locale: active, setLocale } = useActiveLocale();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-white/10 p-1">
      {LOCALES.map((locale) => {
        const isActive = active === locale;
        return (
          <Pressable
            key={locale}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => setLocale(locale)}
            hitSlop={6}
            className={cn(
              "rounded-full px-3 py-1",
              isActive ? "bg-white/90" : "bg-transparent",
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                isActive ? "text-brand-logo-fg" : "text-white/70",
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
