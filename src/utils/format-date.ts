import type { AppLocale } from "@/i18n";

const LOCALE_TAGS: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

/**
 * Formats a date for display, e.g. "28 Jul 2026" / "Jul 28, 2026".
 *
 * The locale is a parameter rather than a `currentLocale()` read for the same
 * reason as in format-currency: with the React Compiler enabled, reading
 * module state during render leaves the output memoized forever.
 */
export function formatDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** True when both dates fall on the same calendar day in local time. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
