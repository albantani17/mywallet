import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertTransactionCanBeDeleted,
  DebtPaymentTransactionDeletionError,
} from "../transaction-deletion.ts";

describe("transaction deletion policy", () => {
  it("allows a transaction that is not a debt repayment", () => {
    assert.doesNotThrow(() => assertTransactionCanBeDeleted(false));
  });

  it("rejects deleting a debt repayment outside its debt flow", () => {
    assert.throws(
      () => assertTransactionCanBeDeleted(true),
      DebtPaymentTransactionDeletionError,
    );
  });
});
