import { readFile, readdir } from "node:fs/promises";
import { pool, tx } from "../server/db.js";
export async function migrate() {
  await tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(271023)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const file of (
      await readdir(new URL("./migrations/", import.meta.url))
    ).sort()) {
      if (
        !(
          await c.query("SELECT 1 FROM schema_migrations WHERE name=$1", [file])
        ).rowCount
      ) {
        await c.query(
          await readFile(
            new URL("./migrations/" + file, import.meta.url),
            "utf8",
          ),
        );
        await c.query("INSERT INTO schema_migrations(name) VALUES($1)", [file]);
      }
    }
  });
}
if (process.argv[1]?.endsWith("migrate.js")) {
  await migrate();
  console.log("Migrations committed.");
  await pool.end();
}
