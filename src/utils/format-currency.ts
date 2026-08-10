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

const COMPACT_UNITS: Record<AppLocale, { thousand: string; million: string; billion: string }> = {
  id: { thousand: "rb", million: "jt", billion: "M" },
  en: { thousand: "K", million: "M", billion: "B" },
};

/**
 * A short money label, e.g. "Rp 1,2 jt" — for chart axes and projections, where
 * the full number does not fit and its last digits mean nothing anyway.
 *
 * Written by hand rather than via `Intl`'s compact notation: Hermes ships a
 * trimmed ICU, and "jt"/"rb" are what Indonesian readers actually expect.
 */
export function formatCompactCurrency(
  amount: number,
  locale: AppLocale,
  currency = "IDR",
): string {
  const units = COMPACT_UNITS[locale];
  const absolute = Math.abs(amount);

  const [value, unit] =
    absolute >= 1_000_000_000
      ? [amount / 1_000_000_000, units.billion]
      : absolute >= 1_000_000
        ? [amount / 1_000_000, units.million]
        : absolute >= 10_000
          ? [amount / 1_000, units.thousand]
          : [amount, ""];

  // Small amounts keep their exact figure; anything shortened keeps one
  // decimal, which is the difference between "1 jt" and "1,9 jt".
  const formatted = new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: unit === "" ? 0 : 1,
  }).format(value);

  return unit === "" ? formatted : `${formatted} ${unit}`;
}

/** Parses digits typed into an amount field; returns null when unusable. */
export function parseAmountInput(value: string): number | null {
  const digits = value.replace(/[^\d-]/g, "");
  if (digits === "" || digits === "-") return null;

  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
