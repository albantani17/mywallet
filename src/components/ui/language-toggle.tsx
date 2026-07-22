import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { currentLocale, setLocale, type AppLocale } from "@/i18n";

const LOCALES: AppLocale[] = ["id", "en"];

/** Toggle pill untuk berpindah bahasa aplikasi (ID / EN). */
export function LanguageToggle() {
  // useTranslation() memicu re-render saat bahasa berubah.
  useTranslation();
  const active = currentLocale();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-white/10 p-1">
      {LOCALES.map((locale) => {
        const isActive = active === locale;
        return (
          <Pressable
            key={locale}
            onPress={() => setLocale(locale)}
            hitSlop={6}
            className={`rounded-full px-3 py-1 ${isActive ? "bg-white/90" : ""}`}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? "text-brand-logo-fg" : "text-white/70"
              }`}
            >
              {locale.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
