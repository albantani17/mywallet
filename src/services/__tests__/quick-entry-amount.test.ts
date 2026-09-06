import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findBareAmount,
  findExplicitAmounts,
  findFee,
  parseAmountToken,
  selectAmount,
} from "../quick-entry-amount.ts";
import { createSpanSet, tokenize } from "../quick-entry-tokens.ts";

/** Runs a scanner over a fresh sentence, the way the pipeline would. */
function scan(raw: string) {
  const tokens = tokenize(raw);
  const spans = createSpanSet(raw.length);
  return { tokens, spans };
}

function explicit(raw: string) {
  const { tokens, spans } = scan(raw);
  return findExplicitAmounts(tokens, spans);
}

describe("parseAmountToken", () => {
  it("scales the Indonesian magnitude suffixes", () => {
    assert.deepEqual(parseAmountToken("25rb"), { value: 25_000, isGuessed: false });
    assert.deepEqual(parseAmountToken("25ribu"), { value: 25_000, isGuessed: false });
    assert.deepEqual(parseAmountToken("25k"), { value: 25_000, isGuessed: false });
    assert.deepEqual(parseAmountToken("2jt"), { value: 2_000_000, isGuessed: false });
    assert.deepEqual(parseAmountToken("3miliar"), {
      value: 3_000_000_000,
      isGuessed: false,
    });
  });

  it("reads a comma or a short dot group as a decimal", () => {
    assert.equal(parseAmountToken("1,5jt")?.value, 1_500_000);
    assert.equal(parseAmountToken("2.5jt")?.value, 2_500_000);
    assert.equal(parseAmountToken("1,25jt")?.value, 1_250_000);
  });

  it("reads full three-digit groups as thousands separators", () => {
    assert.equal(parseAmountToken("1.500.000")?.value, 1_500_000);
    assert.equal(parseAmountToken("10.000")?.value, 10_000);
    assert.equal(parseAmountToken("2.675rb")?.value, 2_675_000);
  });

  it("stays on integers — a float scale leaves a fractional tail", () => {
    const parsed = parseAmountToken("2.675rb");
    assert.equal(Number.isInteger(parsed?.value), true);
    assert.equal(parsed?.value, 2_675_000);
  });

  it("refuses a suffix glued to more letters", () => {
    // 2kg is two kilos, not two thousand.
    assert.equal(parseAmountToken("2kg"), null);
    assert.equal(parseAmountToken("50kg"), null);
    assert.equal(parseAmountToken("3km"), null);
  });

  it("refuses a decimal with no magnitude behind it — rupiah has no cents", () => {
    assert.equal(parseAmountToken("12.30"), null); // a clock
    assert.equal(parseAmountToken("5.00"), null);
    assert.equal(parseAmountToken("25,5"), null);
  });

  it("leaves a plain integer to the fallback scanner", () => {
    assert.equal(parseAmountToken("25000"), null);
    assert.equal(parseAmountToken("2026"), null);
  });

  it("flags the readings that are ambiguous by a factor of a thousand", () => {
    assert.deepEqual(parseAmountToken("10m"), { value: 10_000_000, isGuessed: true });
    assert.deepEqual(parseAmountToken("gocap"), { value: 50_000, isGuessed: true });
    assert.deepEqual(parseAmountToken("ceban"), { value: 10_000, isGuessed: true });
  });
});

describe("findExplicitAmounts", () => {
  it("joins a number to a magnitude word written separately", () => {
    assert.deepEqual(
      explicit("makan 25 ribu").map((m) => m.value),
      [25_000],
    );
    assert.deepEqual(
      explicit("gaji 2,5 juta").map((m) => m.value),
      [2_500_000],
    );
  });

  it("reads a fraction of a magnitude", () => {
    assert.deepEqual(
      explicit("1/2 juta buat servis motor").map((m) => m.value),
      [500_000],
    );
    assert.deepEqual(
      explicit("setengah juta").map((m) => m.value),
      [500_000],
    );
  });

  it("multiplies a count on either side, and flags the result", () => {
    const before = explicit("beli galon 2 x 20rb");
    assert.equal(before[0].value, 40_000);
    assert.equal(before[0].isGuessed, true);

    const after = explicit("pulsa 50rb x 2");
    assert.equal(after[0].value, 100_000);
    assert.equal(after[0].isGuessed, true);
  });

  it("does not treat a quantity as a multiplier without the connective", () => {
    assert.deepEqual(
      explicit("beli 3 kopi 25rb").map((m) => m.value),
      [25_000],
    );
  });

  it("never invents thousands from a unit abbreviation", () => {
    assert.deepEqual(
      explicit("beli 2kg beras 30rb").map((m) => m.value),
      [30_000],
    );
    assert.deepEqual(
      explicit("50kg semen 900rb").map((m) => m.value),
      [900_000],
    );
  });
});

describe("findFee", () => {
  it("takes the number right after a run of fee words", () => {
    const { tokens, spans } = scan("tf 500rb ke jago biaya admin 6500");
    const fee = findFee(tokens, spans);
    assert.equal(fee?.value, 6_500);
  });

  it("reads a fee written with a magnitude too", () => {
    const { tokens, spans } = scan("transfer biaya 6,5rb");
    assert.equal(findFee(tokens, spans)?.value, 6_500);
  });

  it("ignores a fee word that is part of something else", () => {
    // "biaya sekolah 500rb" is tuition, and 500rb is the amount, not a fee.
    const { tokens, spans } = scan("bayar biaya sekolah 500rb");
    assert.equal(findFee(tokens, spans), null);
  });
});

describe("findBareAmount", () => {
  function bare(raw: string) {
    const { tokens, spans } = scan(raw);
    return findBareAmount(tokens, spans);
  }

  it("promotes a small trailing number to thousands, and says it guessed", () => {
    assert.deepEqual(
      { value: bare("parkir 2")?.value, isGuessed: bare("parkir 2")?.isGuessed },
      { value: 2_000, isGuessed: true },
    );
  });

  it("treats a small number followed by a word as a count, not an amount", () => {
    // Inventing Rp 3.000 here is worse than giving up: it looks right enough
    // to be confirmed without reading.
    assert.equal(bare("beli 3 kopi"), null);
    assert.equal(bare("2 porsi"), null);
  });

  it("takes a full-size number as written", () => {
    assert.equal(bare("makan 25000")?.value, 25_000);
    assert.equal(bare("makan 25000")?.isGuessed, false);
  });
});

describe("selectAmount", () => {
  const one = { value: 100, start: 0, end: 1, isGuessed: false };
  const two = { value: 200, start: 2, end: 3, isGuessed: false };

  it("gives up rather than guessing when there is nothing", () => {
    assert.equal(selectAmount([]), null);
  });

  it("takes a lone candidate as it stands", () => {
    assert.deepEqual(selectAmount([one]), one);
  });

  it("takes the last of several and flags it", () => {
    // "refund 50rb dari belanja 300rb" — largest-wins picks the wrong one.
    const picked = selectAmount([one, two]);
    assert.equal(picked?.value, 200);
    assert.equal(picked?.isGuessed, true);
  });
});
