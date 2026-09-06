import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BackupError,
  backupFileName,
  parseBackup,
  schemaTagIndex,
  serializeBackup,
  totalRows,
  type BackupTables,
} from "../backup-format.ts";

const LOCAL_TAG = "0006_blushing_changeling";

const meta = {
  appVersion: "1.0.0",
  schemaTag: LOCAL_TAG,
  createdAt: new Date("2026-08-18T07:32:00.000Z"),
};

function tables(overrides: Partial<BackupTables> = {}): BackupTables {
  return {
    users: [
      {
        id: 1,
        name: "Alban",
        auth_provider: "guest",
        email: null,
        locale: "id",
        theme: "system",
        created_at: 1786286547335,
      },
    ],
    wallets: [{ id: 1, name: "Cash", opening_balance: 250_000 }],
    transactions: [],
    ...overrides,
  };
}

/** Round-trips through the exact text a backup file would contain. */
function roundTrip(source: BackupTables = tables()) {
  return parseBackup(serializeBackup(source, meta), LOCAL_TAG);
}

describe("serialize and parse", () => {
  it("preserves every value through a round trip", () => {
    const file = roundTrip();

    assert.equal(file.format, BACKUP_FORMAT);
    assert.equal(file.formatVersion, BACKUP_FORMAT_VERSION);
    assert.equal(file.appVersion, "1.0.0");
    assert.equal(file.schemaTag, LOCAL_TAG);
    assert.equal(file.createdAt, "2026-08-18T07:32:00.000Z");
    assert.deepEqual(file.tables, tables());
  });

  it("keeps nulls as nulls rather than dropping the key", () => {
    const file = roundTrip();

    assert.ok("email" in file.tables.users[0]);
    assert.equal(file.tables.users[0].email, null);
  });

  it("derives a row count for every table, empty ones included", () => {
    const file = roundTrip();

    assert.deepEqual(file.counts, { users: 1, wallets: 1, transactions: 0 });
  });

  it("totals the rows across all tables", () => {
    assert.equal(totalRows(roundTrip()), 2);
  });
});

describe("rejecting files we cannot restore", () => {
  const expectCode = (code: string, run: () => unknown) => {
    assert.throws(run, (e: unknown) => {
      assert.ok(e instanceof BackupError, `expected a BackupError, got ${e}`);
      assert.equal(e.code, code);
      return true;
    });
  };

  it("rejects text that is not JSON", () => {
    expectCode("corrupt", () => parseBackup("not json at all", LOCAL_TAG));
  });

  it("rejects JSON that is not a backup", () => {
    expectCode("unknownFormat", () =>
      parseBackup(JSON.stringify({ hello: "world" }), LOCAL_TAG),
    );
  });

  it("rejects a backup written by a newer format", () => {
    const text = JSON.stringify({
      ...JSON.parse(serializeBackup(tables(), meta)),
      formatVersion: 99,
    });

    expectCode("futureFormat", () => parseBackup(text, LOCAL_TAG));
  });

  it("rejects a backup whose schema is ahead of this device", () => {
    const text = serializeBackup(tables(), {
      ...meta,
      schemaTag: "0099_far_future",
    });

    expectCode("futureSchema", () => parseBackup(text, LOCAL_TAG));
  });

  it("accepts a backup from an older schema", () => {
    const text = serializeBackup(tables(), {
      ...meta,
      schemaTag: "0002_handy_rockslide",
    });

    assert.equal(parseBackup(text, LOCAL_TAG).schemaTag, "0002_handy_rockslide");
  });

  it("rejects a truncated table whose count no longer matches", () => {
    const file = JSON.parse(serializeBackup(tables(), meta));
    file.tables.wallets = [];

    expectCode("corrupt", () => parseBackup(JSON.stringify(file), LOCAL_TAG));
  });

  it("rejects a backup with no account row", () => {
    expectCode("corrupt", () =>
      parseBackup(serializeBackup(tables({ users: [] }), meta), LOCAL_TAG),
    );
  });

  it("rejects a backup whose account row is not id 1", () => {
    const source = tables();
    source.users[0].id = 2;

    expectCode("corrupt", () =>
      parseBackup(serializeBackup(source, meta), LOCAL_TAG),
    );
  });
});

describe("schema tag ordering", () => {
  it("orders by the migration index, not lexically", () => {
    assert.ok(schemaTagIndex("0010_x") > schemaTagIndex("0009_x"));
    assert.equal(schemaTagIndex("0006_blushing_changeling"), 6);
  });

  it("treats an unparseable tag as older than everything", () => {
    assert.equal(schemaTagIndex("nonsense"), -1);
    assert.ok(schemaTagIndex("nonsense") < schemaTagIndex("0000_first"));
  });
});

describe("file naming", () => {
  it("stamps the local date and time", () => {
    // Constructed from local parts so the assertion does not depend on the
    // machine's time zone.
    const name = backupFileName(new Date(2026, 7, 18, 9, 5));

    assert.equal(name, "mywallet-backup-2026-08-18-0905.json");
  });

  it("always produces a .json name", () => {
    assert.match(backupFileName(new Date()), /^mywallet-backup-[\d-]+\.json$/);
  });
});
