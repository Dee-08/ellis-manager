// Disposable cluster only. Never reads the user's .env or touches its database.
import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", resolve);
});
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const directory = await mkdtemp(join(tmpdir(), "ellis-tests-"));
const password = randomBytes(24).toString("hex");
const database = new EmbeddedPostgres({
  databaseDir: directory,
  user: "ellis_test",
  password,
  port,
  persistent: false,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: (message) => {
    if (/FATAL/.test(message)) console.error(message);
  },
  onError: () => {},
});
let started = false;
try {
  console.log(
    "Preparing isolated ellis_test PostgreSQL cluster on loopback port " +
      port +
      ".",
  );
  await database.initialise();
  console.log("Isolated cluster initialized.");
  await database.start();
  started = true;
  console.log("Isolated cluster started.");
  const client = database.getPgClient();
  await client.connect();
  await client.query("CREATE DATABASE ellis_test");
  await client.end();
  const child = spawn(
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      "tests/identity.test.js",
      "tests/integration.test.js",
      "tests/edge-cases.test.js",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        ELLIS_TEST_DATABASE: "disposable",
        DATABASE_URL: `postgresql://ellis_test:${password}@127.0.0.1:${port}/ellis_test`,
        SESSION_SECRET: randomBytes(48).toString("hex"),
        APP_ORIGIN: "http://127.0.0.1:5173",
      },
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
  if (process.env.ELLIS_BROWSER_TEST === "true" && process.exitCode === 0) {
    const testEnv = {
      ...process.env,
      NODE_ENV: "test",
      ELLIS_TEST_DATABASE: "disposable",
      DATABASE_URL: `postgresql://ellis_test:${password}@127.0.0.1:${port}/ellis_test`,
      SESSION_SECRET: randomBytes(48).toString("hex"),
      APP_ORIGIN: "http://127.0.0.1:5175",
      PORT: "3002",
      ELLIS_TEST_API: "true",
      VITE_REVIEW_MODE: "false",
    };
    const api = spawn(process.execPath, ["server/index.js"], {
      stdio: "inherit",
      env: testEnv,
    });
    const frontend = spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "--host",
        "127.0.0.1",
        "--port",
        "5175",
        "--strictPort",
      ],
      { stdio: "inherit", env: testEnv },
    );
    console.log(
      "Disposable browser test environment: http://127.0.0.1:5175. No access to the user database or real email.",
    );
    await new Promise((resolve) => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
      api.once("exit", resolve);
      frontend.once("exit", resolve);
    });
    api.kill();
    frontend.kill();
  }
} catch {
  process.exitCode = 1;
  console.error(
    "Isolated test infrastructure failed; this is not a passed test run.",
  );
} finally {
  if (started) await database.stop();
}
