import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CATEGORY_KEYWORDS } from "../quick-entry-lexicon.ts";
import {
  parseTransaction,
  toCreateTransactionInput,
  type ParseContext,
  type ParsedDraft,
} from "../quick-entry-parser.ts";

/** Monday 7 September 2026, 14:30 local. */
const NOW = new Date(2026, 8, 7, 14, 30);

const EXPENSE_SLUGS = [
  "food-drink", "transport", "shopping", "groceries", "health",
  "entertainment", "education", "debt-repayment", "money-lent",
  "other-expense",
];
const INCOME_SLUGS = [
  "salary", "bonus", "investment-income", "gift", "loan-received",
  "loan-collected", "other-income",
];
const BILL_SLUGS = [
  "electricity", "water", "internet", "phone", "rent", "insurance",
  "installment", "subscription", "other-bill",
];

const categories = [
  ...EXPENSE_SLUGS.map((slug) => ({ slug, type: "expense" as const })),
  ...INCOME_SLUGS.map((slug) => ({ slug, type: "income" as const })),
  ...BILL_SLUGS.map((slug) => ({ slug, type: "bill" as const })),
].map((entry, index) => ({
  id: index + 100,
  slug: entry.slug,
  label: entry.slug,
  type: entry.type,
}));

const idOf = (slug: string): number => {
  const found = categories.find((category) => category.slug === slug);
  assert.ok(found, `no fixture category for ${slug}`);
  return found.id;
};

const BASE: ParseContext = {
  now: NOW,
  wallets: [
    { id: 1, name: "BCA", type: "bank" },
    { id: 2, name: "GoPay", type: "ewallet" },
    { id: 3, name: "Tunai", type: "cash" },
    { id: 4, name: "Bank Jago", type: "bank" },
    { id: 5, name: "DANA", type: "ewallet" },
  ],
  categories,
  aliases: [],
  defaultWalletId: 1,
};

function parse(text: string, overrides: Partial<ParseContext> = {}): ParsedDraft {
  return parseTransaction(text, { ...BASE, ...overrides });
}

function slugOf(draft: ParsedDraft): string | null {
  const found = categories.find((category) => category.id === draft.categoryId);
  return found?.slug ?? null;
}

function ymd(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

describe("amounts inside a sentence", () => {
  it("reads the ordinary case", () => {
    const draft = parse("makan siang 25rb");
    assert.equal(draft.type, "expense");
    assert.equal(draft.amount, 25_000);
    assert.equal(draft.walletId, 1);
    assert.equal(slugOf(draft), "food-drink");
    assert.equal(ymd(draft.occurredAt), "2026-09-07");
    assert.equal(draft.note, "makan siang");
  });

  it("does not mistake a count for money", () => {
    assert.equal(parse("beli 3 kopi 25rb").amount, 25_000);
  });

  it("gives up rather than inventing an amount from a count", () => {
    const draft = parse("beli 3 kopi");
    assert.equal(draft.amount, null);
    assert.ok(draft.guessed.includes("amount"));
  });

  it("multiplies a stated count", () => {
    assert.equal(parse("beli galon 2 x 20rb").amount, 40_000);
    assert.equal(parse("pulsa 50rb x 2").amount, 100_000);
  });

  it("never turns a unit abbreviation into thousands", () => {
    assert.equal(parse("beli 2kg beras 30rb").amount, 30_000);
    assert.equal(parse("50kg semen 900rb").amount, 900_000);
  });

  it("promotes a small trailing number", () => {
    const draft = parse("parkir 2");
    assert.equal(draft.amount, 2_000);
    assert.equal(slugOf(draft), "transport");
  });

  it("leaves a year to the date scanner instead of billing it", () => {
    const draft = parse("bayar kos januari 2026");
    assert.equal(draft.amount, null);
    assert.equal(ymd(draft.occurredAt), "2026-01-01");
  });

  it("refuses a clock and a stray decimal", () => {
    assert.equal(parse("makan 12.30").amount, null);
    assert.equal(parse("bayar 5.00").amount, null);
  });

  it("strips currency decoration", () => {
    assert.equal(parse("Rp10.000,-").amount, 10_000);
    assert.equal(parse("belanja 1.500.000").amount, 1_500_000);
  });

  it("keeps the arithmetic exact", () => {
    assert.equal(parse("2.675rb").amount, 2_675_000);
  });

  it("reads a fraction of a magnitude", () => {
    const draft = parse("1/2 juta buat servis motor");
    assert.equal(draft.amount, 500_000);
    assert.equal(slugOf(draft), "transport");
  });

  it("flags a sentence carrying two amounts rather than merging them", () => {
    const draft = parse("makan 25rb dan bensin 50rb");
    assert.ok(draft.guessed.includes("amount"));
  });
});

describe("transfers", () => {
  it("moves money between two named wallets", () => {
    const draft = parse("transfer 1,5jt ke Jago");
    assert.equal(draft.type, "transfer");
    assert.equal(draft.amount, 1_500_000);
    assert.equal(draft.walletId, 1);
    assert.equal(draft.toWalletId, 4);
    assert.equal(draft.categoryId, null);
  });

  it("demotes a transfer that names no destination", () => {
    // The database rejects a transfer with a null destination outright, so the
    // parser has to resolve this rather than hand over an unsaveable draft.
    const draft = parse("tf ke andi 200rb");
    assert.equal(draft.type, "expense");
    assert.equal(draft.toWalletId, null);
    assert.equal(slugOf(draft), "money-lent");
    assert.ok(draft.guessed.includes("type"));
  });

  it("demotes a transfer whose destination is its own source", () => {
    const draft = parse("transfer 1jt ke BCA");
    assert.equal(draft.type, "expense");
    assert.equal(draft.toWalletId, null);
    assert.ok(draft.guessed.includes("type"));
  });

  it("reads a top-up into the named wallet", () => {
    const draft = parse("topup gopay 100rb");
    assert.equal(draft.type, "transfer");
    assert.equal(draft.walletId, 1);
    assert.equal(draft.toWalletId, 2);
  });

  it("does not call a phone top-up a transfer", () => {
    const draft = parse("topup pulsa 100rb");
    assert.notEqual(draft.type, "transfer");
    assert.equal(draft.toWalletId, null);
  });

  it("runs a withdrawal and a deposit in opposite directions", () => {
    const out = parse("tarik tunai 500rb dari BCA");
    assert.equal(out.type, "transfer");
    assert.equal(out.walletId, 1);
    assert.equal(out.toWalletId, 3);

    const back = parse("setor tunai 1jt ke BCA");
    assert.equal(back.type, "transfer");
    assert.equal(back.walletId, 3);
    assert.equal(back.toWalletId, 1);
  });

  it("takes a fee alongside the amount", () => {
    const draft = parse("tf 500rb ke jago biaya admin 6500");
    assert.equal(draft.type, "transfer");
    assert.equal(draft.amount, 500_000);
    assert.equal(draft.fee, 6_500);
    assert.equal(draft.toWalletId, 4);
  });
});

describe("wallets that are also ordinary words", () => {
  it("takes a common-word wallet when a cue points at it", () => {
    assert.equal(parse("isi dana 100rb").toWalletId, 5);
    assert.equal(parse("bayar pakai jago 50rb").walletId, 4);
    assert.equal(parse("bayar tunai 50rb").walletId, 3);
  });

  it("leaves the everyday meaning alone", () => {
    const funds = parse("dana darurat 500rb");
    assert.equal(funds.walletId, 1);
    assert.equal(funds.toWalletId, null);

    assert.equal(parse("dia jago masak, makan 50rb").walletId, 1);
  });

  it("refuses to choose between two wallets answering to one word", () => {
    const draft = parse("bayar bank 50rb", {
      wallets: [
        { id: 7, name: "Bank", type: "bank" },
        { id: 8, name: "bank", type: "bank" },
      ],
      defaultWalletId: null,
    });
    assert.equal(draft.walletId, null);
    assert.ok(draft.guessed.includes("wallet"));
  });

  it("matches a two-word wallet name no single token could reach", () => {
    assert.equal(parse("bayar pakai bank jago 50rb").walletId, 4);
  });

  it("does not attach a wallet to a word that merely shares its prefix", () => {
    const draft = parse("gofood 45rb");
    assert.equal(draft.walletId, 1);
    assert.equal(slugOf(draft), "food-drink");
  });
});

describe("dates in a sentence", () => {
  it("treats today's weekday as today", () => {
    assert.equal(ymd(parse("senin 20rb").occurredAt), "2026-09-07");
    assert.equal(ymd(parse("senin lalu 20rb").occurredAt), "2026-08-31");
  });

  it("prefers the week over the Sunday", () => {
    const draft = parse("minggu lalu belanja bulanan 800rb");
    assert.equal(ymd(draft.occurredAt), "2026-08-31");
    assert.equal(slugOf(draft), "groceries");
  });

  it("walks back a month for a day that has not come round yet", () => {
    const draft = parse("tgl 30 bayar listrik 350rb");
    assert.equal(ymd(draft.occurredAt), "2026-08-30");
    assert.equal(draft.type, "bill");
    assert.equal(slugOf(draft), "electricity");
  });

  it("falls back to now, without calling that a guess", () => {
    const draft = parse("kopi 25rb");
    assert.equal(ymd(draft.occurredAt), "2026-09-07");
    assert.equal(draft.guessed.includes("date"), false);
  });
});

describe("type detection", () => {
  it("upgrades to a bill when the category is one", () => {
    const draft = parse("listrik 350rb");
    assert.equal(draft.type, "bill");
    assert.equal(slugOf(draft), "electricity");
    assert.ok(draft.guessed.includes("type"));
  });

  it("does not read a purchase as income because of one word", () => {
    assert.equal(parse("beli kado 250rb").type, "expense");
    assert.equal(slugOf(parse("beli kado 250rb")), "shopping");

    const discount = parse("dapat diskon 20rb beli baju 200rb");
    assert.equal(discount.type, "expense");
    assert.equal(discount.amount, 200_000);

    const toll = parse("masuk tol 15rb");
    assert.equal(toll.type, "expense");
    assert.equal(slugOf(toll), "transport");
  });

  it("still reads real income", () => {
    assert.equal(parse("dapat cashback 25rb").type, "income");

    const salary = parse("gaji 10jt masuk BCA");
    assert.equal(salary.type, "income");
    assert.equal(salary.amount, 10_000_000);
    assert.equal(salary.walletId, 1);
    assert.equal(slugOf(salary), "salary");
  });

  it("keeps borrowing and lending apart", () => {
    const borrowed = parse("pinjam ke andi 500rb");
    assert.equal(borrowed.type, "income");
    assert.equal(slugOf(borrowed), "loan-received");

    const lent = parse("pinjemin andi 500rb");
    assert.equal(lent.type, "expense");
    assert.equal(slugOf(lent), "money-lent");
  });

  it("prefers the longer category phrase", () => {
    assert.equal(slugOf(parse("beli mesin kopi 2jt")), "shopping");
    assert.equal(slugOf(parse("beli obat nyamuk 15rb")), "groceries");
  });
});

describe("learned aliases", () => {
  it("beat the built-in vocabulary", () => {
    const draft = parse("warteg 20rb", {
      aliases: [{ phrase: "warteg", kind: "category", targetId: idOf("groceries") }],
    });
    assert.equal(slugOf(draft), "groceries");
  });

  it("can name a wallet the sentence never spells out", () => {
    const draft = parse("bayar lewat gojek 30rb", {
      aliases: [{ phrase: "gojek", kind: "wallet", targetId: 2 }],
    });
    assert.equal(draft.walletId, 2);
  });
});

describe("nothing to go on", () => {
  it("returns a usable draft for empty input", () => {
    const draft = parse("");
    assert.equal(draft.amount, null);
    assert.equal(draft.type, "expense");
    assert.equal(draft.walletId, 1);
    assert.equal(draft.note, null);
  });

  it("keeps unrecognised words as the note", () => {
    const draft = parse("asdfgh");
    assert.equal(draft.amount, null);
    assert.equal(draft.note, "asdfgh");
    assert.ok(draft.guessed.includes("amount"));
  });

  it("reports leftovers as contiguous runs, never glued across a gap", () => {
    const draft = parse("warteg 20rb enak banget");
    assert.deepEqual(
      draft.unparsedSpans.map((span) => span.text),
      ["warteg", "enak banget"],
    );
  });
});

describe("toCreateTransactionInput", () => {
  /**
   * The property that catches the whole "transfer with no destination" class:
   * whatever the parser produces, it is either refused outright or satisfies
   * every constraint the database will check.
   */
  const SENTENCES = [
    "makan siang 25rb", "beli 3 kopi", "tf ke andi 200rb", "transfer 1jt ke BCA",
    "topup gopay 100rb", "topup pulsa 100rb", "tarik tunai 500rb dari BCA",
    "setor tunai 1jt ke BCA", "isi dana 100rb", "dana darurat 500rb",
    "listrik 350rb", "gaji 10jt masuk BCA", "pinjam ke andi 500rb",
    "tf 500rb ke jago biaya admin 6500", "", "asdfgh", "bayar kos januari 2026",
  ];

  it("never emits a payload the database would reject", () => {
    for (const sentence of SENTENCES) {
      const input = toCreateTransactionInput(parse(sentence));
      if (input === null) continue;

      assert.ok(input.amount > 0, `${sentence}: amount must be positive`);
      assert.ok(Number.isInteger(input.amount), `${sentence}: amount must be whole`);

      if (input.type === "transfer") {
        assert.notEqual(input.toWalletId, null, `${sentence}: transfer needs a destination`);
        assert.notEqual(input.toWalletId, input.walletId, `${sentence}: source equals destination`);
        assert.equal(input.categoryId, null, `${sentence}: a transfer carries no category`);
      } else {
        assert.equal(input.toWalletId, null, `${sentence}: only transfers have a destination`);
      }
    }
  });

  it("refuses a draft with no amount", () => {
    assert.equal(toCreateTransactionInput(parse("beli 3 kopi")), null);
  });

  it("refuses a draft with no wallet", () => {
    assert.equal(
      toCreateTransactionInput(parse("makan 25rb", { defaultWalletId: null, wallets: [] })),
      null,
    );
  });
});

describe("the lexicon and the fixtures agree", () => {
  it("has a fixture category for every slug the lexicon names", () => {
    const known = new Set(categories.map((category) => category.slug));
    const missing = Object.keys(CATEGORY_KEYWORDS).filter((slug) => !known.has(slug));
    assert.deepEqual(missing, []);
  });
});
