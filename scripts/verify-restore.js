import EmbeddedPostgres from "embedded-postgres";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const expected = JSON.parse(
  await readFile(".local/backup-counts.json", "utf8"),
);
const password = await readFile(".local/db-password", "utf8");
const pg = new EmbeddedPostgres({
  databaseDir: ".local/backups/cold-20261023",
  user: "ellis",
  password,
  port: 55433,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
await pg.start();
const c = pg.getPgClient("ellis_dev");
await c.connect();
try {
  const actual = {};
  for (const table of Object.keys(expected)) {
    actual[table] = (
      await c.query("SELECT count(*)::int AS n FROM " + table)
    ).rows[0].n;
    assert.equal(actual[table], expected[table], table + " count");
  }
  assert.equal(
    (await c.query("SELECT 1 FROM patients WHERE name='Nala — browser test'"))
      .rowCount,
    1,
  );
  await writeFile(
    "docs/restore-evidence.json",
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        method:
          "Cleanly stopped PostgreSQL physical copy, booted separately on loopback port 55433",
        expected,
        actual,
        passed: true,
        limitations:
          "Same-machine test only. Not an off-site backup, not a production schedule.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Restore verified: all table counts match and browser-created patient is present.",
  );
} finally {
  await c.end();
  await pg.stop();
}
