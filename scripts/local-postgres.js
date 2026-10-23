import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
if (process.env.NODE_ENV === "production")
  throw new Error("Local development database only.");
await mkdir(".local", { recursive: true });
let password;
if (existsSync(".local/db-password"))
  password = await readFile(".local/db-password", "utf8");
else {
  password = randomBytes(32).toString("hex");
  await writeFile(".local/db-password", password, { mode: 0o600 });
}
const pg = new EmbeddedPostgres({
  databaseDir: ".local/postgres",
  user: "ellis",
  password,
  port: 55432,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
if (!existsSync(".local/postgres/PG_VERSION")) await pg.initialise();
await pg.start();
const c = pg.getPgClient();
await c.connect();
if (
  !(await c.query("SELECT 1 FROM pg_database WHERE datname='ellis_dev'"))
    .rowCount
)
  await c.query("CREATE DATABASE ellis_dev");
await c.end();
if (!existsSync(".env"))
  await writeFile(
    ".env",
    `DATABASE_URL=postgresql://ellis:${password}@127.0.0.1:55432/ellis_dev\nSESSION_SECRET=${randomBytes(48).toString("hex")}\nAPP_ORIGIN=http://127.0.0.1:5173\nPORT=3001\nNODE_ENV=development\n`,
    { mode: 0o600 },
  );
console.log(
  "Local PostgreSQL ready on loopback port 55432; persistent data in .local/postgres.",
);
process.on("SIGINT", async () => {
  await pg.stop();
  process.exit();
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit();
});
