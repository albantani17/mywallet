/**
 * The domain-free half of quick entry: splitting a sentence into tokens that
 * still know where they came from, and matching phrases against them without
 * ever letting two matches claim the same words.
 *
 * Offsets into the original string are the whole point. Every scanner consumes
 * the span it understood, and whatever is left over — contiguous, in the
 * user's own casing — becomes the transaction's note. Re-joining and
 * re-splitting the text between stages would lose both.
 *
 * Nothing here knows about money, dates, wallets or categories.
 */

export type Token = {
  /** The original slice, casing and punctuation intact. */
  text: string;
  /**
   * Lowercased, with edge punctuation, a glued `Rp`/`IDR` prefix and a
   * receipt-style `,-` tail removed. Inner separators survive, because
   * `25.000`, `12:30` and `1/2` all mean something to a later scanner.
   */
  lower: string;
  /** `lower` with every non-alphanumeric character dropped, for phrase keys. */
  key: string;
  start: number;
  end: number;
};

export type SpanSet = { mask: Uint8Array };

export type Ngram = {
  key: string;
  wordCount: number;
  start: number;
  end: number;
};

export type PhraseIndex = Map<string, number[]>;

export type PhraseMatch = {
  id: number;
  key: string;
  wordCount: number;
  start: number;
  end: number;
  /** Two different entries answer to this phrase, so the caller must not guess. */
  isAmbiguous: boolean;
};

export type TextSpan = { text: string; start: number; end: number };

const LEADING_PUNCTUATION = /^[([{"'“‘]+/;
const TRAILING_PUNCTUATION = /[)\]}"'”’!?;:,.\-]+$/;
/** `Rp10.000` and `IDR25000`; only a prefix when a digit actually follows. */
const CURRENCY_PREFIX = /^(?:rp|idr)\.?(?=\d)/;

/**
 * Unicode-normalises and lowercases one token.
 *
 * NFKC folds full-width digits and the compatibility characters that arrive
 * when text is pasted from a banking app; `×` is folded to `x` so the
 * multiplier scanner only has one form to know about.
 */
function normalizeToken(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[×✕✖]/g, "x")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(LEADING_PUNCTUATION, "")
    .replace(TRAILING_PUNCTUATION, "")
    .replace(CURRENCY_PREFIX, "");
}

/**
 * Splits on whitespace, keeping each token's offsets.
 *
 * Whitespace is the only separator: splitting on punctuation as well would
 * tear `25.000`, `12:30` and `1/2` apart, and those are exactly the shapes the
 * amount and date scanners have to see whole.
 */
export function tokenize(raw: string): Token[] {
  const tokens: Token[] = [];

  for (const match of raw.matchAll(/\S+/g)) {
    const text = match[0];
    const start = match.index;
    const lower = normalizeToken(text);
    // A token that was nothing but punctuation carries no meaning and no
    // note-worthy text either.
    if (lower === "") continue;

    tokens.push({
      text,
      lower,
      key: lower.replace(/[^a-z0-9]/g, ""),
      start,
      end: start + text.length,
    });
  }

  return tokens;
}

export function createSpanSet(length: number): SpanSet {
  return { mask: new Uint8Array(length) };
}

export function consume(spans: SpanSet, start: number, end: number): void {
  spans.mask.fill(1, start, end);
}

/** True when *any* character in the range is already spoken for. */
export function isConsumed(spans: SpanSet, start: number, end: number): boolean {
  for (let i = start; i < end; i += 1) {
    if (spans.mask[i]) return true;
  }
  return false;
}

/**
 * Every contiguous run of 1..maxWords tokens, **longest first**.
 *
 * The ordering is load-bearing: consumers take the first match they can and
 * mark it consumed, which is what makes "belanja bulanan" win over "belanja"
 * and "kemarin lusa" win over "kemarin".
 */
export function ngrams(tokens: Token[], maxWords: number): Ngram[] {
  const result: Ngram[] = [];

  for (let size = maxWords; size >= 1; size -= 1) {
    for (let i = 0; i + size <= tokens.length; i += 1) {
      const run = tokens.slice(i, i + size);
      result.push({
        key: run.map((token) => token.key).join(""),
        wordCount: size,
        start: run[0].start,
        end: run[run.length - 1].end,
      });
    }
  }

  return result;
}

/**
 * Indexes entries by their phrases, collapsed to alphanumerics.
 *
 * Collapsing is what lets "Bank Jago" match the two tokens `bank jago`, and
 * "GO-PAY" match `gopay`, without ever falling back to substring matching —
 * `gofood` and `gopay` share a prefix, so a substring rule would attach the
 * wrong wallet to a food order.
 */
export function buildPhraseIndex(
  entries: { id: number; phrases: string[] }[],
): PhraseIndex {
  const index: PhraseIndex = new Map();

  for (const entry of entries) {
    for (const phrase of entry.phrases) {
      const key = phrase
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (key === "") continue;

      const ids = index.get(key);
      if (ids) {
        if (!ids.includes(entry.id)) ids.push(entry.id);
      } else {
        index.set(key, [entry.id]);
      }
    }
  }

  return index;
}

/**
 * Finds every phrase in the index, longest first, consuming as it goes.
 *
 * A phrase claimed by two entries is returned with `isAmbiguous` so the caller
 * can refuse to choose. Silently taking the first of two equally good wallets
 * is wrong half the time, and the user has no way to see that it happened.
 */
export function findPhrases(
  tokens: Token[],
  index: PhraseIndex,
  spans: SpanSet,
  { maxWords = 3 }: { maxWords?: number } = {},
): PhraseMatch[] {
  const matches: PhraseMatch[] = [];

  for (const candidate of ngrams(tokens, maxWords)) {
    const ids = index.get(candidate.key);
    if (!ids) continue;
    if (isConsumed(spans, candidate.start, candidate.end)) continue;

    consume(spans, candidate.start, candidate.end);
    matches.push({
      id: ids[0],
      key: candidate.key,
      wordCount: candidate.wordCount,
      start: candidate.start,
      end: candidate.end,
      isAmbiguous: ids.length > 1,
    });
  }

  return matches;
}

/**
 * The words nothing claimed, as contiguous runs.
 *
 * Contiguity matters beyond tidiness: these runs are the candidates for a
 * learned alias, and gluing leftovers from opposite ends of the sentence would
 * mint a phrase the user never typed and that can never match again.
 */
export function remainingSpans(
  raw: string,
  tokens: Token[],
  spans: SpanSet,
): TextSpan[] {
  const runs: TextSpan[] = [];
  let current: { start: number; end: number } | null = null;

  for (const token of tokens) {
    if (isConsumed(spans, token.start, token.end)) {
      if (current) runs.push(sliceRun(raw, current));
      current = null;
      continue;
    }

    if (current) current.end = token.end;
    else current = { start: token.start, end: token.end };
  }

  if (current) runs.push(sliceRun(raw, current));
  return runs.filter((run) => run.text !== "");
}

function sliceRun(raw: string, run: { start: number; end: number }): TextSpan {
  const text = raw
    .slice(run.start, run.end)
    .replace(LEADING_PUNCTUATION, "")
    .replace(TRAILING_PUNCTUATION, "")
    .trim();

  return { text, start: run.start, end: run.end };
}
