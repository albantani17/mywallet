import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findDate,
  resolveDayOfMonth,
  resolveWeekday,
} from "../quick-entry-date.ts";
import { createSpanSet, remainingSpans, tokenize } from "../quick-entry-tokens.ts";

/** Monday 7 September 2026, 14:30 local. */
const NOW = new Date(2026, 8, 7, 14, 30);

function ymd(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function find(raw: string) {
  const tokens = tokenize(raw);
  const spans = createSpanSet(raw.length);
  const match = findDate(tokens, spans, NOW);
  return { match, spans, tokens, raw };
}

function on(raw: string): string | null {
  const { match } = find(raw);
  return match ? ymd(match.date) : null;
}

describe("resolveDayOfMonth", () => {
  it("stays in this month when the day has already passed", () => {
    assert.equal(ymd(resolveDayOfMonth(NOW, 3)!), "2026-09-03");
  });

  it("walks back a month rather than landing in the future", () => {
    assert.equal(ymd(resolveDayOfMonth(NOW, 30)!), "2026-08-30");
  });

  it("skips a month that has no such day", () => {
    // 5 March: the 31st is still ahead, February has none, so January answers.
    const march = new Date(2026, 2, 5, 9, 0);
    assert.equal(ymd(resolveDayOfMonth(march, 31)!), "2026-01-31");
  });
});

describe("resolveWeekday", () => {
  it("counts today as the most recent occurrence", () => {
    assert.equal(ymd(resolveWeekday(NOW, 1, "bare")), "2026-09-07");
  });

  it("reaches back for a day earlier in the week", () => {
    assert.equal(ymd(resolveWeekday(NOW, 5, "bare")), "2026-09-04");
  });

  it("takes 'lalu' as exactly a week before that", () => {
    assert.equal(ymd(resolveWeekday(NOW, 1, "last")), "2026-08-31");
  });
});

describe("findDate", () => {
  it("returns nothing when the sentence names no date", () => {
    assert.equal(findDate(tokenize("kopi 25rb"), createSpanSet(9), NOW), null);
  });

  it("keeps the current clock for today and uses midday for other days", () => {
    const today = find("hari ini").match!;
    assert.equal(today.date.getHours(), 14);
    assert.equal(today.date.getMinutes(), 30);

    const yesterday = find("kemarin").match!;
    assert.equal(yesterday.date.getHours(), 12);
  });

  it("reads the plain relative days", () => {
    assert.equal(on("kemarin"), "2026-09-06");
    assert.equal(on("3 hari lalu"), "2026-09-04");
    assert.equal(on("2 hari yang lalu"), "2026-09-05");
  });

  it("prefers the longer phrase over the one inside it", () => {
    // "kemarin lusa" must not become "kemarin" with an orphan "lusa".
    const { match, spans, tokens, raw } = find("kemarin lusa");
    assert.equal(ymd(match!.date), "2026-09-05");
    assert.deepEqual(remainingSpans(raw, tokens, spans), []);
  });

  it("tells a week apart from a Sunday", () => {
    // "minggu" is both; the longer phrase decides.
    assert.equal(on("minggu lalu"), "2026-08-31");
    assert.equal(on("hari minggu"), "2026-09-06");
  });

  it("counts months by the calendar, not by thirty days", () => {
    assert.equal(on("bulan lalu"), "2026-08-07");
  });

  it("resolves a weekday and admits the direction was a guess", () => {
    const { match } = find("gajian jumat");
    assert.equal(ymd(match!.date), "2026-09-04");
    assert.equal(match!.isGuessed, true);
  });

  it("reads an explicit day of the month", () => {
    assert.equal(on("tgl 30"), "2026-08-30");
    assert.equal(on("tanggal 3"), "2026-09-03");
  });

  it("reads a slashed date but never eats a fraction of an amount", () => {
    assert.equal(on("5/9"), "2026-09-05");
    assert.equal(on("1/2 juta"), null);
  });

  it("reads a month name, with or without its year", () => {
    assert.equal(on("januari 2026"), "2026-01-01");
    assert.equal(on("bayar kos januari 2026"), "2026-01-01");
  });

  it("takes a time of day only behind 'tadi'", () => {
    const morning = find("tadi pagi").match!;
    assert.equal(morning.date.getHours(), 8);

    // Bare "siang" belongs to "makan siang" and must survive for the category.
    const { match, spans, tokens, raw } = find("makan siang");
    assert.equal(match, null);
    assert.deepEqual(
      remainingSpans(raw, tokens, spans).map((s) => s.text),
      ["makan siang"],
    );
  });

  it("reads a clock time onto today", () => {
    const at = find("12:30").match!;
    assert.equal(ymd(at.date), "2026-09-07");
    assert.equal(at.date.getHours(), 12);
    assert.equal(at.date.getMinutes(), 30);
  });

  it("never lands in the future", () => {
    const { match } = find("31/12");
    assert.equal(match!.date <= NOW, true);
    assert.equal(ymd(match!.date), "2025-12-31");
  });
});
