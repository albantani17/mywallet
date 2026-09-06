import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPhraseIndex,
  consume,
  createSpanSet,
  findPhrases,
  isConsumed,
  ngrams,
  remainingSpans,
  tokenize,
} from "../quick-entry-tokens.ts";

describe("tokenize", () => {
  it("returns nothing for empty or blank input", () => {
    assert.deepEqual(tokenize(""), []);
    assert.deepEqual(tokenize("   "), []);
  });

  it("keeps offsets into the original string", () => {
    const tokens = tokenize("kopi 25rb");
    assert.equal(tokens.length, 2);
    assert.deepEqual(
      tokens.map((t) => [t.text, t.start, t.end]),
      [
        ["kopi", 0, 4],
        ["25rb", 5, 9],
      ],
    );
  });

  it("preserves the original casing in text and lowercases separately", () => {
    const [token] = tokenize("GoPay");
    assert.equal(token.text, "GoPay");
    assert.equal(token.lower, "gopay");
  });

  it("strips punctuation at the edges but never inside a number", () => {
    assert.equal(tokenize("masak,")[0].lower, "masak");
    assert.equal(tokenize("(kopi)")[0].lower, "kopi");
    assert.equal(tokenize("25.000")[0].lower, "25.000");
    assert.equal(tokenize("12:30")[0].lower, "12:30");
    assert.equal(tokenize("1/2")[0].lower, "1/2");
  });

  it("strips a glued Rp prefix and a receipt tail", () => {
    assert.equal(tokenize("Rp10.000,-")[0].lower, "10.000");
    assert.equal(tokenize("IDR25000")[0].lower, "25000");
    assert.equal(tokenize("10.000.-")[0].lower, "10.000");
    // Rp only counts as a prefix when a digit follows it.
    assert.equal(tokenize("rp")[0].lower, "rp");
  });

  it("collapses to an alphanumeric key for phrase matching", () => {
    assert.equal(tokenize("GO-PAY")[0].key, "gopay");
    assert.equal(tokenize("e-wallet")[0].key, "ewallet");
  });
});

describe("span set", () => {
  it("reports a range as consumed once any of it is taken", () => {
    const spans = createSpanSet(10);
    assert.equal(isConsumed(spans, 0, 5), false);
    consume(spans, 2, 4);
    assert.equal(isConsumed(spans, 0, 5), true);
    assert.equal(isConsumed(spans, 5, 10), false);
  });
});

describe("ngrams", () => {
  it("emits the longest runs first so a phrase beats its own first word", () => {
    const tokens = tokenize("belanja bulanan besar");
    const phrases = ngrams(tokens, 2).map((n) => n.key);
    assert.deepEqual(phrases, [
      "belanjabulanan",
      "bulananbesar",
      "belanja",
      "bulanan",
      "besar",
    ]);
  });

  it("carries the offsets of the whole run", () => {
    const tokens = tokenize("bank jago");
    const [first] = ngrams(tokens, 2);
    assert.equal(first.key, "bankjago");
    assert.equal(first.start, 0);
    assert.equal(first.end, 9);
  });
});

describe("findPhrases", () => {
  const index = buildPhraseIndex([
    { id: 1, phrases: ["GoPay"] },
    { id: 2, phrases: ["Bank Jago"] },
    { id: 3, phrases: ["obat", "obat nyamuk"] },
  ]);

  it("matches a multi-word name that no single token could reach", () => {
    const tokens = tokenize("bayar pakai bank jago");
    const spans = createSpanSet("bayar pakai bank jago".length);
    const matches = findPhrases(tokens, index, spans);
    assert.deepEqual(
      matches.map((m) => m.id),
      [2],
    );
  });

  it("prefers the longest phrase", () => {
    const tokens = tokenize("beli obat nyamuk");
    const spans = createSpanSet("beli obat nyamuk".length);
    const [match] = findPhrases(tokens, index, spans);
    assert.equal(match.id, 3);
    assert.equal(match.wordCount, 2);
  });

  it("does not match on a shared prefix", () => {
    const tokens = tokenize("gofood 45rb");
    const spans = createSpanSet("gofood 45rb".length);
    assert.deepEqual(findPhrases(tokens, index, spans), []);
  });

  it("flags a phrase that two entries claim", () => {
    const ambiguous = buildPhraseIndex([
      { id: 1, phrases: ["Bank BCA"] },
      { id: 2, phrases: ["Bank Jago"] },
      { id: 3, phrases: ["bank"] },
      { id: 4, phrases: ["bank"] },
    ]);
    const tokens = tokenize("bayar bank");
    const spans = createSpanSet("bayar bank".length);
    const [match] = findPhrases(tokens, ambiguous, spans);
    assert.equal(match.isAmbiguous, true);
  });

  it("skips anything already consumed", () => {
    const raw = "topup gopay";
    const tokens = tokenize(raw);
    const spans = createSpanSet(raw.length);
    consume(spans, 6, 11);
    assert.deepEqual(findPhrases(tokens, index, spans), []);
  });
});

describe("remainingSpans", () => {
  it("returns contiguous runs only, never words glued across a gap", () => {
    const raw = "warteg 20rb enak banget";
    const tokens = tokenize(raw);
    const spans = createSpanSet(raw.length);
    consume(spans, 7, 11); // "20rb"

    assert.deepEqual(
      remainingSpans(raw, tokens, spans).map((s) => s.text),
      ["warteg", "enak banget"],
    );
  });

  it("keeps the original casing and trims edge punctuation", () => {
    const raw = "Makan siang, 25rb";
    const tokens = tokenize(raw);
    const spans = createSpanSet(raw.length);
    consume(spans, 13, 17);

    assert.deepEqual(
      remainingSpans(raw, tokens, spans).map((s) => s.text),
      ["Makan siang"],
    );
  });
});
