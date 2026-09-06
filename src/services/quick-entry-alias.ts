import {
  AMOUNT_SUFFIXES,
  DAY_OFFSET_PHRASES,
  MONTHS,
  MONTH_OFFSET_PHRASES,
  SLANG_AMOUNTS,
  STOPWORDS,
  TIME_OF_DAY,
  TYPE_BLOCKERS,
  TYPE_KEYWORDS,
  UNIT_NOUNS,
  WALLET_CUE_WORDS,
  WEEKDAYS,
} from "./quick-entry-lexicon.ts";
import type { TextSpan } from "./quick-entry-tokens.ts";

export type AliasProposal = {
  phrase: string;
  kind: "wallet" | "category";
  targetId: number;
};

export type AliasCorrection = {
  /** Which field the user actually changed. Only that field may be learned. */
  field: "wallet" | "category";
  targetId: number;
};

const MAX_WORDS = 3;
const MIN_WORD_LENGTH = 3;

const STOPWORD_SET = new Set(STOPWORDS);

/**
 * The grammar the parser cannot afford to lose.
 *
 * Bind an alias to "kemarin" and the date scanner starts losing to it; bind
 * one to "transfer" and the type detector does. Category vocabulary is
 * deliberately *not* here: correcting a built-in guess — the parser said
 * food-drink, the user meant groceries — is exactly what learning is for, and
 * refusing it would leave that user wrong forever.
 */
const RESERVED = new Set<string>([
  ...TYPE_KEYWORDS.map((entry) => entry.phrase),
  ...TYPE_BLOCKERS,
  ...UNIT_NOUNS,
  ...WALLET_CUE_WORDS,
  ...Object.keys(DAY_OFFSET_PHRASES),
  ...Object.keys(MONTH_OFFSET_PHRASES),
  ...Object.keys(WEEKDAYS),
  ...Object.keys(MONTHS),
  ...Object.keys(TIME_OF_DAY),
  ...Object.keys(SLANG_AMOUNTS),
  ...AMOUNT_SUFFIXES.map((entry) => entry.suffix),
  "tgl",
  "tanggal",
  "lalu",
  "lusa",
]);

function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drops the leading and trailing particles so "di warteg" learns "warteg". */
function trimStopwords(words: string[]): string[] {
  let start = 0;
  let end = words.length;
  while (start < end && STOPWORD_SET.has(words[start])) start += 1;
  while (end > start && STOPWORD_SET.has(words[end - 1])) end -= 1;
  return words.slice(start, end);
}

/**
 * Suggests one phrase to remember from a correction, or nothing.
 *
 * Nothing is the common answer, and deliberately so. A wrong alias is silent:
 * it misfiles later transactions without ever announcing itself, and the user
 * has no reason to suspect a feature they may not know exists. So every rule
 * here is a reason to decline — numbers, particles, words the parser already
 * owns, leftovers too long to ever recur, and any case where two candidates
 * are equally good.
 *
 * Pure by design: the caller decides whether to ask the user and whether to
 * write the row.
 */
export function proposeAlias(
  unparsedSpans: TextSpan[],
  correction: AliasCorrection,
  context: { walletNames: string[] },
): AliasProposal | null {
  const walletWords = new Set(
    context.walletNames.flatMap((name) => normalize(name).split(" ")),
  );

  const candidates = unparsedSpans
    .map((span) => trimStopwords(normalize(span.text).split(" ").filter(Boolean)))
    .filter((words) => {
      if (words.length === 0 || words.length > MAX_WORDS) return false;
      if (words.some((word) => /\d/.test(word))) return false;
      if (words.some((word) => word.length < MIN_WORD_LENGTH)) return false;
      if (words.every((word) => STOPWORD_SET.has(word))) return false;

      const phrase = words.join(" ");
      if (RESERVED.has(phrase) || words.some((word) => RESERVED.has(word))) return false;
      if (words.some((word) => walletWords.has(word))) return false;
      return true;
    })
    .map((words, index) => ({ phrase: words.join(" "), wordCount: words.length, index }));

  if (candidates.length === 0) return null;

  // Short phrases recur; long ones were a one-off sentence. A tie between two
  // equally short leftovers is unresolvable, and guessing is worse than not
  // learning at all.
  candidates.sort((a, b) => a.wordCount - b.wordCount || a.index - b.index);
  if (candidates.length > 1 && candidates[0].wordCount === candidates[1].wordCount) {
    return null;
  }

  return {
    phrase: candidates[0].phrase,
    kind: correction.field,
    targetId: correction.targetId,
  };
}
