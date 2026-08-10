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

/**
 * Day boundaries in local time, on a copy — the caller's date is never moved.
 *
 * A date range filter has to span whole days: picking "to = 30 Jul" and
 * comparing against the bare Date would cut the range at midnight and drop
 * everything recorded during that day.
 */
export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/**
 * Month boundaries in local time, on a copy.
 *
 * The insight queries compare like-for-like windows, so the two ends have to be
 * built the same way: the first instant of the first day, the last instant of
 * the last one.
 */
export function startOfMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  // Day 0 of the next month is the last day of this one, leap years included.
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/**
 * Shifts by whole months, clamping the day rather than overflowing: one month
 * before 31 March is 28 February, not 3 March.
 */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();

  const copy = new Date(date);
  copy.setFullYear(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
  return copy;
}

/** How many days the month containing `date` has. */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** "Agu" / "Aug" — the axis label for a monthly chart. */
export function formatMonthShort(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: "short",
  }).format(date);
}

/** "Agu 2026" / "Aug 2026", for a comparison that may cross a year. */
export function formatMonthYear(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
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

/**
 * Relative day checks for section headers.
 *
 * `now` is a parameter so a list computes it once and every header agrees, and
 * so the caller decides when "today" is re-evaluated. The words themselves stay
 * in the components: translations belong to `t()`, not to a util.
 */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return isSameDay(date, now);
}

export function isYesterday(date: Date, now: Date = new Date()): boolean {
  const yesterday = new Date(now);
  // setDate handles month and year rollover, which naive arithmetic on the
  // timestamp does not across a DST change.
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}
