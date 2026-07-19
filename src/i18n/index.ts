import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { id } from "./locales/id";

export type AppLocale = "en" | "id";

const SUPPORTED: AppLocale[] = ["en", "id"];

/** Ambil bahasa dari device, fallback ke Indonesia. */
export function getDeviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode;
  return SUPPORTED.includes(code as AppLocale) ? (code as AppLocale) : "id";
}

export const resources = {
  en: { translation: en },
  id: { translation: id },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: "id",
  interpolation: {
    escapeValue: false,
  },
});

/** Ganti bahasa aktif secara global. */
export function setLocale(locale: AppLocale) {
  return i18n.changeLanguage(locale);
}

/** Bahasa yang sedang aktif (dinormalisasi ke locale yang didukung). */
export function currentLocale(): AppLocale {
  const lng = i18n.language as AppLocale;
  return SUPPORTED.includes(lng) ? lng : "id";
}

export default i18n;
