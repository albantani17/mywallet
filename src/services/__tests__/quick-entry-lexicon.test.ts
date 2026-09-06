import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATEGORY_KEYWORDS,
  SLANG_AMOUNTS,
  TYPE_BLOCKERS,
  TYPE_KEYWORDS,
  UNIT_NOUNS,
  WALLET_COMMON_WORDS,
  WALLET_CUE_WORDS,
} from "../quick-entry-lexicon.ts";

/**
 * These are data invariants, not behaviour. They are asserted mechanically
 * because the lexicon is the file that will be edited most often and by hand,
 * and every one of these mistakes fails silently at runtime.
 */
describe("lexicon invariants", () => {
  const everyPhrase = [
    ...Object.values(CATEGORY_KEYWORDS).flat(),
    ...TYPE_KEYWORDS.map((entry) => entry.phrase),
    ...TYPE_BLOCKERS,
    ...UNIT_NOUNS,
    ...WALLET_COMMON_WORDS,
    ...WALLET_CUE_WORDS,
    ...Object.keys(SLANG_AMOUNTS),
  ];

  it("keeps every phrase lowercase — matching never upper-cases the input", () => {
    const offenders = everyPhrase.filter((phrase) => phrase !== phrase.toLowerCase());
    assert.deepEqual(offenders, []);
  });

  it("has no blank or padded phrases", () => {
    const offenders = everyPhrase.filter((phrase) => phrase.trim() !== phrase || phrase === "");
    assert.deepEqual(offenders, []);
  });

  it("gives every category slug at least one keyword", () => {
    const empty = Object.entries(CATEGORY_KEYWORDS)
      .filter(([, words]) => words.length === 0)
      .map(([slug]) => slug);
    assert.deepEqual(empty, []);
  });

  it("never lists the same keyword twice under one slug", () => {
    for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
      assert.equal(new Set(words).size, words.length, `duplicate keyword in ${slug}`);
    }
  });

  it("never lets two categories of the same kind claim one phrase", () => {
    // A phrase under two same-type slugs would resolve by object key order,
    // which is not a decision anybody made.
    const EXPENSE = new Set([
      "food-drink", "transport", "shopping", "groceries", "health",
      "entertainment", "education", "debt-repayment", "money-lent",
    ]);
    const INCOME = new Set([
      "salary", "bonus", "investment-income", "gift", "loan-received",
      "loan-collected",
    ]);
    const BILL = new Set([
      "electricity", "water", "internet", "phone", "rent", "insurance",
      "installment", "subscription",
    ]);

    for (const group of [EXPENSE, INCOME, BILL]) {
      const seen = new Map<string, string>();
      for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
        if (!group.has(slug)) continue;
        for (const word of words) {
          const owner = seen.get(word);
          assert.equal(owner, undefined, `"${word}" claimed by ${owner} and ${slug}`);
          seen.set(word, slug);
        }
      }
    }
  });
});
