import type { AppLocale } from "@/i18n";

const LOCALE_TAGS: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

/**
 * Formats a stored money amount for display.
 *
 * Amounts are stored as whole units of their currency (rupiah, not sen), so
 * the integer is formatted as-is with no fractional digits — IDR has no
 * fractional part anyone uses.
 *
 * The locale is a parameter rather than a `currentLocale()` read so that
 * components re-render on a language switch; with the React Compiler enabled,
 * reading module state during render leaves the output memoized forever.
 */
export function formatCurrency(
  amount: number,
  locale: AppLocale,
  currency = "IDR",
): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Same as formatCurrency but without the currency symbol. */
export function formatAmount(amount: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Parses digits typed into an amount field; returns null when unusable. */
export function parseAmountInput(value: string): number | null {
  const digits = value.replace(/[^\d-]/g, "");
  if (digits === "" || digits === "-") return null;

  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
