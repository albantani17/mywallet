import {
  DAY_OFFSET_PHRASES,
  MONTHS,
  MONTH_OFFSET_PHRASES,
  TIME_OF_DAY,
  WEEKDAYS,
} from "./quick-entry-lexicon.ts";
import { consume, isConsumed, type SpanSet, type Token } from "./quick-entry-tokens.ts";

export type DateMatch = {
  date: Date;
  start: number;
  end: number;
  /** The date was inferred — a bare weekday, a rolled-back year, a clamped day. */
  isGuessed: boolean;
};

/**
 * The hour a date lands on when it is not today.
 *
 * Midday rather than midnight: nothing in this app cares about the hour of a
 * past transaction, and noon keeps a date comparison from flipping across a
 * boundary the way 00:00 can.
 */
const DEFAULT_HOUR = 12;

const INTEGER = /^\d+$/;
const CLOCK = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;
const SLASHED = /^(\d{1,2})[/-](\d{1,2})$/;
const YEAR = /^(19|20)\d{2}$/;

const RELATIVE_UNITS: Record<string, "day" | "week" | "month"> = {
  hari: "day",
  minggu: "week",
  bulan: "month",
};

function atHour(base: Date, hour: number, minute = 0): Date {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Puts a resolved day at the right time: today keeps the clock the user is
 * living in, any other day gets midday.
 */
function settle(date: Date, now: Date): Date {
  return isSameDay(date, now)
    ? new Date(now.getTime())
    : atHour(date, DEFAULT_HOUR);
}

function shiftDays(now: Date, days: number): Date {
  const shifted = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return settle(shifted, now);
}

/**
 * The same day a number of months back, clamped to the shorter month.
 *
 * The 31st of a month whose predecessor has 30 days becomes the 30th, not the
 * 1st of the month after — which is what naive date arithmetic does.
 */
function shiftMonths(now: Date, months: number): Date {
  const target = new Date(now.getFullYear(), now.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  const day = Math.min(now.getDate(), lastDay);
  return settle(
    new Date(target.getFullYear(), target.getMonth(), day),
    now,
  );
}

/**
 * The most recent date with this day number that is not in the future.
 *
 * Walks whole months back rather than clamping: "tgl 30" on 7 September is 30
 * August, and "tgl 31" in March skips February entirely rather than pretending
 * the 28th was meant.
 */
export function resolveDayOfMonth(now: Date, day: number): Date | null {
  if (day < 1 || day > 31) return null;

  for (let back = 0; back <= 24; back += 1) {
    const probe = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const lastDay = new Date(probe.getFullYear(), probe.getMonth() + 1, 0).getDate();
    if (day > lastDay) continue;

    const candidate = atHour(
      new Date(probe.getFullYear(), probe.getMonth(), day),
      DEFAULT_HOUR,
    );
    if (candidate <= now) return settle(candidate, now);
  }

  return null;
}

/**
 * A named weekday, biased to the past.
 *
 * Bare weekdays are genuinely ambiguous — "gajian jumat" means the Friday
 * coming, "bayar kos jumat" the Friday gone — and nothing in the sentence
 * settles it, so the past is chosen and the caller flags the field. Today
 * counts as its own most recent occurrence: on a Monday, "senin" is today.
 */
export function resolveWeekday(
  now: Date,
  weekday: number,
  modifier: "bare" | "last",
): Date {
  const diff = (now.getDay() - weekday + 7) % 7;
  return shiftDays(now, -diff - (modifier === "last" ? 7 : 0));
}

/** Rolls a date back a whole year rather than letting it sit in the future. */
export function notFuture(date: Date, now: Date): { date: Date; wasRolled: boolean } {
  if (date <= now) return { date, wasRolled: false };

  const rolled = new Date(date);
  rolled.setFullYear(rolled.getFullYear() - 1);
  return { date: rolled, wasRolled: true };
}

type Candidate = { date: Date; start: number; end: number; isGuessed: boolean };

/**
 * Finds the date the sentence names, if any, and consumes the words it used.
 *
 * Longest phrases are tried first throughout: "kemarin lusa" must not decay
 * into "kemarin" plus an orphan "lusa", and "minggu lalu" must beat "minggu",
 * which is both a week and a Sunday.
 *
 * Returns null when nothing names a date — the caller supplies "now" — so the
 * absence of a date is never confused with a date of zero.
 */
export function findDate(
  tokens: Token[],
  spans: SpanSet,
  now: Date,
): DateMatch | null {
  const free = (from: number, to: number) =>
    !isConsumed(spans, tokens[from].start, tokens[to].end);

  const take = (candidate: Candidate): DateMatch => {
    consume(spans, candidate.start, candidate.end);
    return candidate;
  };

  // Two- and three-word phrases first.
  for (let size = 3; size >= 1; size -= 1) {
    for (let i = 0; i + size <= tokens.length; i += 1) {
      const run = tokens.slice(i, i + size);
      if (!free(i, i + size - 1)) continue;

      const phrase = run.map((token) => token.lower).join(" ");
      const start = run[0].start;
      const end = run[run.length - 1].end;

      const dayOffset = DAY_OFFSET_PHRASES[phrase];
      if (dayOffset !== undefined) {
        return take({ date: shiftDays(now, dayOffset), start, end, isGuessed: false });
      }

      const monthOffset = MONTH_OFFSET_PHRASES[phrase];
      if (monthOffset !== undefined) {
        return take({
          date: shiftMonths(now, monthOffset),
          start,
          end,
          // The day-of-month is assumed rather than stated.
          isGuessed: true,
        });
      }

      // "tadi pagi" / "tadi malam". The time word alone is left for phrases
      // like "makan siang", which would otherwise lose half its name.
      if (size === 2 && run[0].lower === "tadi") {
        const hour = TIME_OF_DAY[run[1].lower];
        if (hour !== undefined) {
          return take({ date: atHour(now, hour), start, end, isGuessed: true });
        }
      }

      // "senin lalu" / "senin kemarin".
      if (size === 2 && WEEKDAYS[run[0].lower] !== undefined) {
        if (run[1].lower === "lalu" || run[1].lower === "kemarin") {
          return take({
            date: resolveWeekday(now, WEEKDAYS[run[0].lower], "last"),
            start,
            end,
            isGuessed: false,
          });
        }
      }

      // "3 hari lalu", "2 minggu lalu", "4 bulan lalu".
      if (size === 3 && run[2].lower === "lalu" && INTEGER.test(run[0].lower)) {
        const unit = RELATIVE_UNITS[run[1].lower];
        const count = Number(run[0].lower);
        if (unit && count > 0 && count < 400) {
          const date =
            unit === "month"
              ? shiftMonths(now, -count)
              : shiftDays(now, -count * (unit === "week" ? 7 : 1));
          return take({ date, start, end, isGuessed: unit === "month" });
        }
      }
      // "2 hari yang lalu" — the same shape with a particle in the middle.
      if (
        size === 3 &&
        run[2].lower === "yang" &&
        INTEGER.test(run[0].lower) &&
        RELATIVE_UNITS[run[1].lower] &&
        tokens[i + 3]?.lower === "lalu"
      ) {
        const unit = RELATIVE_UNITS[run[1].lower];
        const count = Number(run[0].lower);
        const date =
          unit === "month"
            ? shiftMonths(now, -count)
            : shiftDays(now, -count * (unit === "week" ? 7 : 1));
        return take({
          date,
          start,
          end: tokens[i + 3].end,
          isGuessed: unit === "month",
        });
      }

      // "tgl 30" / "tanggal 3".
      if (
        size === 2 &&
        (run[0].lower === "tgl" || run[0].lower === "tanggal") &&
        INTEGER.test(run[1].lower)
      ) {
        const date = resolveDayOfMonth(now, Number(run[1].lower));
        if (date) return take({ date, start, end, isGuessed: false });
      }

      // "januari 2026" — a month with its year.
      if (size === 2 && MONTHS[run[0].lower] !== undefined && YEAR.test(run[1].lower)) {
        const date = new Date(Number(run[1].lower), MONTHS[run[0].lower], 1, DEFAULT_HOUR);
        return take({ date, start, end, isGuessed: true });
      }

      // "5 januari" — a day with its month.
      if (size === 2 && INTEGER.test(run[0].lower) && MONTHS[run[1].lower] !== undefined) {
        const day = Number(run[0].lower);
        if (day >= 1 && day <= 31) {
          const candidate = new Date(now.getFullYear(), MONTHS[run[1].lower], day, DEFAULT_HOUR);
          const { date, wasRolled } = notFuture(candidate, now);
          return take({ date, start, end, isGuessed: wasRolled });
        }
      }

      if (size !== 1) continue;

      const token = run[0];

      // A bare weekday. "hari minggu" already matched above as a phrase, so a
      // lone "minggu" reaching here really is the day.
      const weekday = WEEKDAYS[token.lower];
      if (weekday !== undefined) {
        return take({
          date: resolveWeekday(now, weekday, "bare"),
          start,
          end,
          // Which direction was meant is not recoverable from the words.
          isGuessed: true,
        });
      }

      const clock = CLOCK.exec(token.lower);
      if (clock) {
        return take({
          date: atHour(now, Number(clock[1]), Number(clock[2])),
          start,
          end,
          isGuessed: false,
        });
      }

      const slashed = SLASHED.exec(token.lower);
      if (slashed) {
        // "1/2 juta" is half a million, not the first of February.
        const next = tokens[i + 1];
        if (next && isAmountWord(next.lower)) continue;

        const day = Number(slashed[1]);
        const month = Number(slashed[2]);
        if (day < 1 || day > 31 || month < 1 || month > 12) continue;

        const candidate = new Date(now.getFullYear(), month - 1, day, DEFAULT_HOUR);
        if (candidate.getMonth() !== month - 1) continue;
        const { date, wasRolled } = notFuture(candidate, now);
        return take({ date, start, end, isGuessed: wasRolled });
      }

      const month = MONTHS[token.lower];
      if (month !== undefined) {
        const candidate = new Date(now.getFullYear(), month, 1, DEFAULT_HOUR);
        const { date } = notFuture(candidate, now);
        return take({ date, start, end, isGuessed: true });
      }
    }
  }

  return null;
}

/** The magnitude words that turn a slashed pair into a fraction of money. */
const AMOUNT_WORDS = new Set(["juta", "jt", "ribu", "rb", "k", "milyar", "miliar"]);

function isAmountWord(lower: string): boolean {
  return AMOUNT_WORDS.has(lower);
}
