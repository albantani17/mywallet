import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { proposeAlias } from "../quick-entry-alias.ts";

const WALLETS = ["BCA", "GoPay", "Tunai"];

function propose(
  spans: string[],
  correction: Parameters<typeof proposeAlias>[1],
) {
  return proposeAlias(
    spans.map((text, index) => ({ text, start: index, end: index + 1 })),
    correction,
    { walletNames: WALLETS },
  );
}

describe("proposeAlias", () => {
  it("binds the leftover words to what the user actually chose", () => {
    assert.deepEqual(propose(["warteg"], { field: "category", targetId: 42 }), {
      phrase: "warteg",
      kind: "category",
      targetId: 42,
    });
  });

  it("prefers the single word over a longer leftover", () => {
    // "warteg 20rb enak banget" leaves two runs; the short one is the name.
    assert.deepEqual(
      propose(["warteg", "enak banget"], { field: "category", targetId: 42 }),
      { phrase: "warteg", kind: "category", targetId: 42 },
    );
  });

  it("learns nothing when two leftovers are equally plausible", () => {
    // Guessing between them is wrong half the time, and a wrong alias is
    // invisible until it misfiles something.
    assert.equal(propose(["warteg", "kantin"], { field: "category", targetId: 42 }), null);
  });

  it("strips a leading verb or preposition", () => {
    assert.equal(
      propose(["di warteg"], { field: "category", targetId: 42 })?.phrase,
      "warteg",
    );
    assert.equal(
      propose(["beli sepatu"], { field: "category", targetId: 42 })?.phrase,
      "sepatu",
    );
  });

  it("refuses anything numeric", () => {
    assert.equal(propose(["3"], { field: "category", targetId: 42 }), null);
    assert.equal(propose(["kopi 3"], { field: "category", targetId: 42 }), null);
  });

  it("refuses very short words and bare stopwords", () => {
    assert.equal(propose(["di"], { field: "category", targetId: 42 }), null);
    assert.equal(propose(["ke sana"], { field: "category", targetId: 42 }), null);
  });

  it("refuses a leftover longer than three words", () => {
    assert.equal(
      propose(["makan siang sama tim kantin"], { field: "category", targetId: 42 }),
      null,
    );
  });

  it("refuses to shadow the grammar", () => {
    // Binding any of these would break sentences that have nothing to do with
    // the correction that created the alias.
    assert.equal(propose(["kemarin"], { field: "category", targetId: 42 }), null);
    assert.equal(propose(["transfer"], { field: "category", targetId: 42 }), null);
    assert.equal(propose(["porsi"], { field: "category", targetId: 42 }), null);
    assert.equal(propose(["gopay"], { field: "category", targetId: 42 }), null);
  });

  it("does let a user override a built-in category guess", () => {
    // The parser calls "kopi" food-drink; someone who buys beans for the
    // office means groceries, and has no other way to say so.
    assert.equal(
      propose(["kopi"], { field: "category", targetId: 42 })?.phrase,
      "kopi",
    );
  });

  it("binds a wallet correction as a wallet alias", () => {
    assert.deepEqual(propose(["gojek"], { field: "wallet", targetId: 2 }), {
      phrase: "gojek",
      kind: "wallet",
      targetId: 2,
    });
  });

  it("proposes nothing when there is no leftover at all", () => {
    assert.equal(propose([], { field: "category", targetId: 42 }), null);
  });

  it("normalises what it stores", () => {
    assert.equal(
      propose(["  Warteg   Bahari!  "], { field: "category", targetId: 42 })?.phrase,
      "warteg bahari",
    );
  });
});
