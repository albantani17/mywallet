import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createChangeBus } from "../change-bus.ts";

const COALESCE_MS = 5;
const settle = () => new Promise((resolve) => setTimeout(resolve, COALESCE_MS * 4));

describe("change bus", () => {
  it("tells a subscriber once for a burst of writes", async () => {
    const bus = createChangeBus(COALESCE_MS);
    let calls = 0;
    bus.subscribe(["payments", "payment_allocations"], () => {
      calls += 1;
    });

    // What recordPayment does: several rows across several tables, one commit.
    bus.record("transactions");
    bus.record("payments");
    bus.record("payment_allocations");
    bus.record("payment_allocations");

    await settle();
    assert.equal(calls, 1);
  });

  it("leaves a subscriber alone when none of its tables changed", async () => {
    const bus = createChangeBus(COALESCE_MS);
    let calls = 0;
    bus.subscribe(["categories"], () => {
      calls += 1;
    });

    bus.record("payments");

    await settle();
    assert.equal(calls, 0);
  });

  it("wakes a wallet query for a write to transactions", async () => {
    const bus = createChangeBus(COALESCE_MS);
    let calls = 0;
    bus.subscribe(["wallets", "transactions", "debts"], () => {
      calls += 1;
    });

    bus.record("transactions");
    await settle();
    assert.equal(calls, 1);

    // A second burst is a second notification, not a missed one.
    bus.record("debts");
    await settle();
    assert.equal(calls, 2);
  });

  it("stops calling an unsubscribed listener", async () => {
    const bus = createChangeBus(COALESCE_MS);
    let calls = 0;
    const unsubscribe = bus.subscribe(["debts"], () => {
      calls += 1;
    });

    unsubscribe();
    bus.record("debts");

    await settle();
    assert.equal(calls, 0);
  });

  it("keeps notifying the others when one unsubscribes mid-broadcast", async () => {
    const bus = createChangeBus(COALESCE_MS);
    const seen: string[] = [];

    const unsubscribe = bus.subscribe(["debts"], () => {
      seen.push("first");
      unsubscribe();
    });
    bus.subscribe(["debts"], () => seen.push("second"));

    bus.record("debts");

    await settle();
    assert.deepEqual(seen, ["first", "second"]);
  });
});
