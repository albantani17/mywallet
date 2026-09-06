import type { CategoryType, TransactionType } from "@/db";

import {
  findBareAmount,
  findExplicitAmounts,
  findFee,
  selectAmount,
  type AmountMatch,
} from "./quick-entry-amount.ts";
import { findDate } from "./quick-entry-date.ts";
import {
  CATEGORY_KEYWORDS,
  TYPE_BLOCKERS,
  TYPE_KEYWORDS,
  WALLET_COMMON_WORDS,
  WALLET_CUE_WORDS,
} from "./quick-entry-lexicon.ts";
import {
  buildPhraseIndex,
  consume,
  createSpanSet,
  findPhrases,
  isConsumed,
  ngrams,
  remainingSpans,
  tokenize,
  type SpanSet,
  type TextSpan,
  type Token,
} from "./quick-entry-tokens.ts";

/**
 * Everything the parser needs to know about this particular user, passed in
 * rather than fetched. That is what keeps the module free of the database and
 * runnable under `node --test` with no transform.
 */
export type ParseContext = {
  now: Date;
  wallets: { id: number; name: string; type: string }[];
  categories: { id: number; slug: string; label: string; type: CategoryType }[];
  /** Phrases this user has taught the parser by correcting it. */
  aliases: { phrase: string; kind: "wallet" | "category"; targetId: number }[];
  defaultWalletId: number | null;
};

export type GuessedField = "type" | "amount" | "wallet" | "category" | "date";

export type ParsedDraft = {
  type: TransactionType;
  amount: number | null;
  walletId: number | null;
  toWalletId: number | null;
  categoryId: number | null;
  fee: number | null;
  occurredAt: Date;
  note: string | null;
  /** Fields inferred rather than read. Sorted, so tests and diffs are stable. */
  guessed: GuessedField[];
  /**
   * Words nothing claimed, as contiguous runs. These are the only candidates
   * for a learned alias — a phrase stitched together across a gap is one the
   * user never typed and could never match again.
   */
  unparsedSpans: TextSpan[];
};

/** Prepositions that carry no meaning once they have done their pointing. */
const FILLER_WORDS = new Set([
  "ke", "dari", "di", "untuk", "buat", "via", "lewat", "dengan", "dgn",
  "pakai", "pake", "dan", "yang", "sama", "to", "from", "for", "with",
]);

const COMMON_WALLET_KEYS = new Set(WALLET_COMMON_WORDS.map(phraseKey));

function phraseKey(phrase: string): string {
  return phrase.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cloneSpans(spans: SpanSet): SpanSet {
  return { mask: new Uint8Array(spans.mask) };
}

// ---------------------------------------------------------------- wallets

type WalletRole = "source" | "destination" | "unassigned";

type WalletHit = {
  id: number | null;
  role: WalletRole;
  start: number;
  end: number;
  isAmbiguous: boolean;
};

/**
 * Indexes each wallet under its full name and under each of its words.
 *
 * The per-word entries are what let "ke Jago" reach a wallet called "Bank
 * Jago". They are also why the common-word guard exists: indexing "bank" and
 * "jago" separately is only safe as long as an everyday use of those words
 * cannot claim a wallet.
 */
function buildWalletIndex(ctx: ParseContext) {
  const entries = ctx.wallets.map((wallet) => {
    const words = wallet.name.split(/\s+/).filter((word) => phraseKey(word).length >= 3);
    return { id: wallet.id, phrases: [wallet.name, ...words] };
  });

  for (const alias of ctx.aliases) {
    if (alias.kind === "wallet") entries.push({ id: alias.targetId, phrases: [alias.phrase] });
  }

  return buildPhraseIndex(entries);
}

/**
 * Finds the wallets a sentence names, and which end of a transfer each is.
 *
 * A wallet whose whole name is an everyday word — DANA, Tunai, Bank, Jago —
 * only counts behind a cue word or at the very end of the sentence. Without
 * that, "dana darurat 500rb" books an emergency *fund* to the DANA wallet and
 * "dia jago masak" opens a bank account.
 */
function findWallets(tokens: Token[], spans: SpanSet, ctx: ParseContext): WalletHit[] {
  const index = buildWalletIndex(ctx);
  const startToIndex = new Map(tokens.map((token, i) => [token.start, i]));
  const lastEnd = tokens.length > 0 ? tokens[tokens.length - 1].end : 0;
  const hits: WalletHit[] = [];

  for (const candidate of ngrams(tokens, 3)) {
    const ids = index.get(candidate.key);
    if (!ids) continue;
    if (isConsumed(spans, candidate.start, candidate.end)) continue;

    const firstIndex = startToIndex.get(candidate.start);
    const previous = firstIndex === undefined ? undefined : tokens[firstIndex - 1];
    const cue = previous && WALLET_CUE_WORDS.includes(previous.lower) ? previous : undefined;

    if (COMMON_WALLET_KEYS.has(candidate.key) && !cue && candidate.end !== lastEnd) {
      continue;
    }

    consume(spans, candidate.start, candidate.end);
    // A pure preposition has said all it has to say; anything that doubles as
    // a type keyword ("isi", "tarik", "setor") is left for type detection.
    if (cue && FILLER_WORDS.has(cue.lower)) consume(spans, cue.start, cue.end);

    hits.push({
      // Two wallets answering to one word is not a choice the parser gets to
      // make silently — it would be wrong half the time and invisible.
      id: ids.length > 1 ? null : ids[0],
      role:
        cue?.lower === "dari" || cue?.lower === "from"
          ? "source"
          : cue?.lower === "ke" || cue?.lower === "to"
            ? "destination"
            : "unassigned",
      start: candidate.start,
      end: candidate.end,
      isAmbiguous: ids.length > 1,
    });
  }

  return hits;
}

// ------------------------------------------------------------------- type

type TypeSignal = {
  kind: "income" | "transfer" | "bill" | null;
  direction: "toCash" | "fromCash" | undefined;
  spans: { start: number; end: number }[];
};

/**
 * Reads the transaction type, without consuming anything yet.
 *
 * Consumption is deferred because several keywords are also the best category
 * evidence in the sentence — "gaji" is both an income marker and the salary
 * category, "pinjam ke" both income and loan-received. Eating them here would
 * cost the category.
 */
function detectType(tokens: Token[], spans: SpanSet): TypeSignal {
  const blockers = new Set(TYPE_BLOCKERS.map(phraseKey));
  const blocked: { start: number; end: number }[] = [];

  for (const candidate of ngrams(tokens, 3)) {
    if (blockers.has(candidate.key)) blocked.push(candidate);
  }

  const overlapsBlocked = (start: number, end: number) =>
    blocked.some((span) => start < span.end && end > span.start);

  const keywords = new Map(TYPE_KEYWORDS.map((entry) => [phraseKey(entry.phrase), entry]));
  const signal: TypeSignal = { kind: null, direction: undefined, spans: [] };
  const claimed: { start: number; end: number }[] = [];

  for (const candidate of ngrams(tokens, 3)) {
    const keyword = keywords.get(candidate.key);
    if (!keyword) continue;
    if (isConsumed(spans, candidate.start, candidate.end)) continue;
    if (overlapsBlocked(candidate.start, candidate.end)) continue;
    if (claimed.some((span) => candidate.start < span.end && candidate.end > span.start)) {
      continue;
    }

    claimed.push({ start: candidate.start, end: candidate.end });
    signal.spans.push({ start: candidate.start, end: candidate.end });

    // A transfer outranks income, which outranks a bill: moving money between
    // your own wallets is a stronger claim than any single verb.
    if (
      keyword.kind === "transfer" ||
      (keyword.kind === "income" && signal.kind !== "transfer") ||
      (keyword.kind === "bill" && signal.kind === null)
    ) {
      signal.kind = keyword.kind;
    }
    if (keyword.direction && !signal.direction) signal.direction = keyword.direction;
  }

  return signal;
}

// --------------------------------------------------------------- category

function resolveCategory(
  tokens: Token[],
  spans: SpanSet,
  ctx: ParseContext,
  type: TransactionType,
): { id: number | null; slug: string | null } {
  if (type === "transfer") return { id: null, slug: null };

  // A bill is an expense that happens to have a name, so an expense sentence
  // is allowed to reach a bill category — that is what upgrades it.
  const allowed = ctx.categories.filter(
    (category) => category.type === type || (type === "expense" && category.type === "bill"),
  );
  const bySlug = new Map(allowed.map((category) => [category.slug, category.id]));
  const allowedIds = new Set(allowed.map((category) => category.id));

  // Aliases run first and on their own index: what the user taught beats the
  // built-in vocabulary even when the built-in phrase is longer.
  const aliasIndex = buildPhraseIndex(
    ctx.aliases
      .filter((alias) => alias.kind === "category" && allowedIds.has(alias.targetId))
      .map((alias) => ({ id: alias.targetId, phrases: [alias.phrase] })),
  );
  const [aliasMatch] = findPhrases(tokens, aliasIndex, spans);
  if (aliasMatch) {
    const slug = allowed.find((category) => category.id === aliasMatch.id)?.slug ?? null;
    return { id: aliasMatch.id, slug };
  }

  const keywordIndex = buildPhraseIndex(
    Object.entries(CATEGORY_KEYWORDS)
      .filter(([slug]) => bySlug.has(slug))
      .map(([slug, phrases]) => ({ id: bySlug.get(slug)!, phrases })),
  );
  const [match] = findPhrases(tokens, keywordIndex, spans);
  if (!match) return { id: null, slug: null };

  const slug = allowed.find((category) => category.id === match.id)?.slug ?? null;
  return { id: match.id, slug };
}

// --------------------------------------------------------------- pipeline

/**
 * Turns a sentence into a draft transaction.
 *
 * The step order is load-bearing, not stylistic. Amounts before dates would
 * bill "januari 2026" as Rp 2.026; wallets before type is what stops "tf ke
 * andi 200rb" from becoming a transfer with nowhere to go, which the database
 * rejects outright. Each stage consumes the characters it understood, so no
 * two stages can claim the same words.
 */
export function parseTransaction(raw: string, ctx: ParseContext): ParsedDraft {
  const tokens = tokenize(raw);
  const spans = createSpanSet(raw.length);
  const guessed = new Set<GuessedField>();

  // 1. A fee first: it is unambiguous, and leaving it to the amount scanner
  //    lets an admin charge become the transaction itself.
  const fee = findFee(tokens, spans);

  // 2. Amounts the sentence states outright.
  const explicitAmounts = findExplicitAmounts(tokens, spans);

  // 3. Dates, before any bare number can be mistaken for one.
  const dateMatch = findDate(tokens, spans, ctx.now);
  if (dateMatch?.isGuessed) guessed.add("date");

  // 4. Wallets, before the type, which needs to know where the money can go.
  const walletHits = findWallets(tokens, spans, ctx);

  // 5. Type — detected now, consumed after the category has had its look.
  const signal = detectType(tokens, spans);
  const resolved = resolveWalletRoles(signal, walletHits, ctx);
  let type: TransactionType =
    resolved.type === "transfer"
      ? "transfer"
      : signal.kind === "income"
        ? "income"
        : signal.kind === "bill"
          ? "bill"
          : "expense";
  if (resolved.wasDemoted) guessed.add("type");

  // 6. Category, on a copy of the spans: these are the content words of the
  //    sentence and they belong in the note as well.
  const category = resolveCategory(tokens, cloneSpans(spans), ctx, type);
  const categoryType = ctx.categories.find((entry) => entry.id === category.id)?.type;
  let categoryId = category.id;

  if (type === "expense" && categoryType === "bill") {
    type = "bill";
    guessed.add("type");
  }

  // A demoted transfer with an unresolved recipient is money handed to a
  // person, which the app already has a category for.
  if (resolved.wasDemoted && categoryId === null && hasFreeRecipient(tokens, spans)) {
    categoryId = ctx.categories.find((entry) => entry.slug === "money-lent")?.id ?? null;
  }

  for (const span of signal.spans) consume(spans, span.start, span.end);

  // 7. A plain number, only if nothing explicit was found.
  const bare = explicitAmounts.length > 0 ? null : findBareAmount(tokens, spans);
  const amountMatch: AmountMatch | null =
    explicitAmounts.length > 0 ? selectAmount(explicitAmounts) : bare;
  if (amountMatch === null || amountMatch.isGuessed) guessed.add("amount");

  // 8. Whatever is left is the user's own words.
  for (const token of tokens) {
    if (FILLER_WORDS.has(token.lower)) consume(spans, token.start, token.end);
  }
  const unparsedSpans = remainingSpans(raw, tokens, spans);
  const note = unparsedSpans.map((span) => span.text).join(" ").trim();

  if (resolved.walletId === null || resolved.isWalletGuessed) guessed.add("wallet");
  if (type !== "transfer" && categoryId === null) guessed.add("category");

  return {
    type,
    amount: amountMatch?.value ?? null,
    walletId: resolved.walletId,
    toWalletId: type === "transfer" ? resolved.toWalletId : null,
    categoryId: type === "transfer" ? null : categoryId,
    fee: type === "transfer" ? (fee?.value ?? null) : null,
    occurredAt: dateMatch?.date ?? new Date(ctx.now.getTime()),
    note: note === "" ? null : note,
    guessed: [...guessed].sort(),
    unparsedSpans,
  };
}

/** True when a "ke"/"to" points at something that turned out not to be a wallet. */
function hasFreeRecipient(tokens: Token[], spans: SpanSet): boolean {
  return tokens.some(
    (token) =>
      (token.lower === "ke" || token.lower === "to") &&
      !isConsumed(spans, token.start, token.end),
  );
}

type ResolvedWallets = {
  type: "transfer" | "other";
  walletId: number | null;
  toWalletId: number | null;
  isWalletGuessed: boolean;
  wasDemoted: boolean;
};

/**
 * Turns the wallets a sentence named into a source and a destination.
 *
 * A transfer that cannot name a destination is demoted to an expense rather
 * than handed on: `transfer_shape` rejects a null destination at the database
 * level, so passing one along would turn "tf ke andi 200rb" into a failed save
 * with nothing the user could do about it. Source equal to destination is
 * demoted for the same reason.
 */
function resolveWalletRoles(
  signal: TypeSignal,
  hits: WalletHit[],
  ctx: ParseContext,
): ResolvedWallets {
  const named = hits.filter((hit) => hit.id !== null);
  const isAmbiguous = hits.some((hit) => hit.isAmbiguous);
  const explicitSource = named.find((hit) => hit.role === "source")?.id ?? null;
  const explicitDestination = named.find((hit) => hit.role === "destination")?.id ?? null;
  const unassigned = named.filter((hit) => hit.role === "unassigned").map((hit) => hit.id!);

  if (signal.kind !== "transfer") {
    const walletId = explicitSource ?? unassigned[0] ?? explicitDestination ?? ctx.defaultWalletId;
    return {
      type: "other",
      walletId,
      toWalletId: null,
      isWalletGuessed: isAmbiguous || named.length === 0,
      wasDemoted: false,
    };
  }

  const cashWalletId =
    unassigned.find((id) => walletTypeOf(ctx, id) === "cash") ??
    ctx.wallets.find((wallet) => wallet.type === "cash")?.id ??
    null;
  const others = unassigned.filter((id) => id !== cashWalletId);

  let source: number | null;
  let destination: number | null;

  if (signal.direction === "toCash") {
    destination = cashWalletId;
    source = explicitSource ?? others[0] ?? ctx.defaultWalletId;
  } else if (signal.direction === "fromCash") {
    source = cashWalletId;
    destination = explicitDestination ?? others[0] ?? null;
  } else {
    destination = explicitDestination ?? unassigned[0] ?? null;
    source =
      explicitSource ??
      unassigned.find((id) => id !== destination) ??
      ctx.defaultWalletId;
  }

  const isImpossible = destination === null || destination === source;
  if (isImpossible) {
    return {
      type: "other",
      walletId: source ?? destination ?? ctx.defaultWalletId,
      toWalletId: null,
      isWalletGuessed: isAmbiguous || named.length === 0,
      wasDemoted: true,
    };
  }

  return {
    type: "transfer",
    walletId: source,
    toWalletId: destination,
    isWalletGuessed: isAmbiguous || explicitSource === null,
    wasDemoted: false,
  };
}

function walletTypeOf(ctx: ParseContext, id: number): string | undefined {
  return ctx.wallets.find((wallet) => wallet.id === id)?.type;
}

/**
 * The single exit from the parser into the rest of the app.
 *
 * Every database CHECK is enforced here rather than in a screen, so the
 * property "a draft either saves or is refused" can be tested without a
 * database. A draft that cannot become a valid transaction returns null; the
 * sheet then asks the user for what is missing.
 */
export function toCreateTransactionInput(draft: ParsedDraft): {
  type: TransactionType;
  amount: number;
  walletId: number;
  toWalletId: number | null;
  categoryId: number | null;
  fee: number | null;
  note: string | null;
  occurredAt: Date;
} | null {
  if (draft.amount === null || !Number.isInteger(draft.amount) || draft.amount <= 0) {
    return null;
  }
  if (draft.walletId === null) return null;

  const isTransfer = draft.type === "transfer";
  if (isTransfer && (draft.toWalletId === null || draft.toWalletId === draft.walletId)) {
    return null;
  }

  return {
    type: draft.type,
    amount: draft.amount,
    walletId: draft.walletId,
    toWalletId: isTransfer ? draft.toWalletId : null,
    categoryId: isTransfer ? null : draft.categoryId,
    fee: isTransfer ? draft.fee : null,
    note: draft.note,
    occurredAt: draft.occurredAt,
  };
}
