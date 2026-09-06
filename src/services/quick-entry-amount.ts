import {
  AMOUNT_SUFFIXES,
  FEE_WORDS,
  MULTIPLIER_WORDS,
  SLANG_AMOUNTS,
  UNIT_NOUNS,
} from "./quick-entry-lexicon.ts";
import { consume, isConsumed, type SpanSet, type Token } from "./quick-entry-tokens.ts";

export type AmountMatch = {
  value: number;
  start: number;
  end: number;
  /** The reading was inferred rather than written, so the sheet marks it. */
  isGuessed: boolean;
};

type ParsedAmount = { value: number; isGuessed: boolean };

/** Thousands separators: every group after the first is exactly three digits. */
const THOUSANDS = /^\d{1,3}(?:\.\d{3})+$/;
/** A decimal fraction, which only means anything with a magnitude behind it. */
const DECIMAL = /^(\d+)[.,](\d{1,2})$/;
const INTEGER = /^\d+$/;
const FRACTION = /^(\d+)\/(\d+)$/;

const SUFFIX_WORDS = new Set(AMOUNT_SUFFIXES.map((entry) => entry.suffix));
const UNIT_NOUN_SET = new Set(UNIT_NOUNS);

/**
 * Scales a numeric string by a magnitude, without ever leaving the integers.
 *
 * `2.675 * 1000` is 2675.0000000000005 in floating point, and this value goes
 * straight into an integer rupiah column — so the fraction is scaled by its
 * own digits instead of being multiplied as a float.
 */
function scaleNumeric(numeric: string, scale: number): number | null {
  if (THOUSANDS.test(numeric)) {
    return Number(numeric.replace(/\./g, "")) * scale;
  }

  const decimal = DECIMAL.exec(numeric);
  if (decimal) {
    // Only meaningful against a magnitude: rupiah has no sub-unit, so a bare
    // "12.30" is a clock and "5.00" is a typo, never money.
    if (scale === 1) return null;

    const [, whole, fraction] = decimal;
    const divisor = 10 ** fraction.length;
    if (scale % divisor !== 0) return null;
    return Number(whole) * scale + Number(fraction) * (scale / divisor);
  }

  const ratio = FRACTION.exec(numeric);
  if (ratio) {
    const [, numerator, denominator] = ratio;
    if (scale === 1 || Number(denominator) === 0) return null;
    const scaled = (Number(numerator) * scale) / Number(denominator);
    return Number.isInteger(scaled) ? scaled : Math.round(scaled);
  }

  if (INTEGER.test(numeric)) {
    // A plain integer on its own is not explicit enough to trust here; the
    // fallback scanner decides what to do with it.
    return scale === 1 ? null : Number(numeric) * scale;
  }

  return null;
}

/**
 * Reads one token as an explicit amount, or returns null.
 *
 * "Explicit" means the token itself says how big it is: a magnitude suffix,
 * thousands separators, or slang. A plain `25000` is left alone.
 */
export function parseAmountToken(lower: string): ParsedAmount | null {
  const slang = SLANG_AMOUNTS[lower];
  if (slang !== undefined) {
    // Literally these are 50, 100, 500 — the money reading is contextual, the
    // same ×1000 ambiguity that gets `m` flagged.
    return { value: slang, isGuessed: true };
  }

  // Longest suffix first, so "ribu" is not read as an "rb" that failed.
  for (const { suffix, scale, isGuessed } of [...AMOUNT_SUFFIXES].sort(
    (a, b) => b.suffix.length - a.suffix.length,
  )) {
    if (!lower.endsWith(suffix)) continue;

    const numeric = lower.slice(0, -suffix.length);
    if (numeric === "") continue;
    // The suffix must end the token. "2kg" ends in "g", not "k"; this is only
    // reached when the remainder is numeric, which "2k" satisfies and "2kg"
    // never can.
    if (!/[\d.,/]$/.test(numeric)) continue;

    const value = scaleNumeric(numeric, scale);
    if (value !== null) return { value, isGuessed };
  }

  const value = scaleNumeric(lower, 1);
  return value === null ? null : { value, isGuessed: false };
}

/** "setengah juta" is as common as "1/2 juta". */
const WORD_FRACTIONS: Record<string, string> = { setengah: "1/2", separuh: "1/2" };

/**
 * Every amount the sentence states outright, consuming the words it used.
 *
 * Handles the two-token form as well — "25 ribu", "1/2 juta" — because people
 * type the magnitude as its own word at least as often as they glue it on.
 */
export function findExplicitAmounts(tokens: Token[], spans: SpanSet): AmountMatch[] {
  const matches: AmountMatch[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (isConsumed(spans, token.start, token.end)) continue;

    let parsed = parseAmountToken(token.lower);
    let end = token.end;
    let lastIndex = i;

    // "<number> <magnitude>" written as two words.
    const next = tokens[i + 1];
    if (
      !parsed &&
      next &&
      SUFFIX_WORDS.has(next.lower) &&
      !isConsumed(spans, next.start, next.end)
    ) {
      const numeric = WORD_FRACTIONS[token.lower] ?? token.lower;
      const combined = parseAmountToken(`${numeric}${next.lower}`);
      if (combined) {
        parsed = combined;
        end = next.end;
        lastIndex = i + 1;
      }
    }

    if (!parsed) continue;

    let { value, isGuessed } = parsed;
    let start = token.start;

    // "2 x 20rb" and "20rb x 2" both mean the product. The count is a real
    // part of the amount, so leaving it out silently under-records by half.
    const beforeConnective = tokens[i - 1];
    const beforeCount = tokens[i - 2];
    const afterConnective = tokens[lastIndex + 1];
    const afterCount = tokens[lastIndex + 2];

    if (
      beforeConnective &&
      beforeCount &&
      MULTIPLIER_WORDS.includes(beforeConnective.lower) &&
      INTEGER.test(beforeCount.lower) &&
      !isConsumed(spans, beforeCount.start, beforeConnective.end)
    ) {
      value *= Number(beforeCount.lower);
      isGuessed = true;
      start = beforeCount.start;
    } else if (
      afterConnective &&
      afterCount &&
      MULTIPLIER_WORDS.includes(afterConnective.lower) &&
      INTEGER.test(afterCount.lower) &&
      !isConsumed(spans, afterConnective.start, afterCount.end)
    ) {
      value *= Number(afterCount.lower);
      isGuessed = true;
      end = afterCount.end;
      lastIndex += 2;
    }

    consume(spans, start, end);
    matches.push({ value, start, end, isGuessed });
    i = lastIndex;
  }

  return matches;
}

/**
 * An admin fee riding along with a transfer.
 *
 * The number has to follow the fee words immediately. Allowing a gap turns
 * "bayar biaya sekolah 500rb" into a Rp 500.000 fee on a transaction with no
 * amount at all.
 */
export function findFee(tokens: Token[], spans: SpanSet): AmountMatch | null {
  for (let i = 0; i < tokens.length; i += 1) {
    if (!FEE_WORDS.includes(tokens[i].lower)) continue;
    if (isConsumed(spans, tokens[i].start, tokens[i].end)) continue;

    let last = i;
    while (tokens[last + 1] && FEE_WORDS.includes(tokens[last + 1].lower)) last += 1;

    const candidate = tokens[last + 1];
    if (!candidate || isConsumed(spans, candidate.start, candidate.end)) continue;

    const parsed =
      parseAmountToken(candidate.lower) ??
      (INTEGER.test(candidate.lower)
        ? { value: Number(candidate.lower), isGuessed: false }
        : null);
    if (!parsed) continue;

    const start = tokens[i].start;
    const end = candidate.end;
    consume(spans, start, end);
    return { value: parsed.value, start, end, isGuessed: parsed.isGuessed };
  }

  return null;
}

/**
 * The last resort: a plain number that survived every other scanner.
 *
 * A small number followed by another word is a count, not money — "beli 3
 * kopi" has no amount in it, and inventing Rp 3.000 there is worse than
 * returning nothing, because a plausible figure gets confirmed without being
 * read. A small number that ends the sentence is the opposite case: "parkir 2"
 * is two thousand, so it is promoted and flagged.
 */
export function findBareAmount(tokens: Token[], spans: SpanSet): AmountMatch | null {
  const candidates: AmountMatch[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (isConsumed(spans, token.start, token.end)) continue;
    if (!INTEGER.test(token.lower)) continue;

    const value = Number(token.lower);
    if (!Number.isSafeInteger(value) || value <= 0) continue;

    const next = tokens[i + 1];
    const hasFollowingWord =
      next !== undefined && !isConsumed(spans, next.start, next.end);

    if (value <= 99 && (hasFollowingWord || (next && UNIT_NOUN_SET.has(next.lower)))) {
      continue;
    }

    candidates.push({
      value: value < 1_000 ? value * 1_000 : value,
      start: token.start,
      end: token.end,
      isGuessed: value < 1_000,
    });
  }

  const picked = selectAmount(candidates);
  if (picked) consume(spans, picked.start, picked.end);
  return picked;
}

/**
 * Chooses between the amounts a sentence offers.
 *
 * Classification, not selection: one candidate is the answer, none means the
 * parser says so plainly, and more than one is a sentence it cannot resolve —
 * "refund 50rb dari belanja 300rb" — so it takes the last and admits it
 * guessed rather than picking the largest and looking certain.
 */
export function selectAmount(matches: AmountMatch[]): AmountMatch | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const last = matches[matches.length - 1];
  return { ...last, isGuessed: true };
}
