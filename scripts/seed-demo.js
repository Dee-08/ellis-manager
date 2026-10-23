import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { pool, tx, audit } from "../server/db.js";
import { hash } from "../server/auth.js";
import { capabilities } from "../server/domain.js";
const url = new URL(process.env.DATABASE_URL);
if (
  process.env.NODE_ENV === "production" ||
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  !url.pathname.endsWith("_dev")
)
  throw new Error(
    "Demo seeding is restricted to loopback development databases ending in _dev.",
  );
const password = randomBytes(18).toString("base64url");
const passwordHash = await hash(password);
await tx(async (c) => {
  if (
    (await c.query("SELECT id FROM accounts WHERE slug='ellis-demo'")).rowCount
  )
    throw new Error("Demo already exists; no records overwritten.");
  const a = (
    await c.query(
      "INSERT INTO accounts(kind,name,slug,timezone) VALUES('clinic','Cedar Veterinary Practice · Demo','ellis-demo','Africa/Lagos') RETURNING id",
    )
  ).rows[0];
  const p = (
    await c.query(
      "INSERT INTO principals(account_id,name,email,password_hash,status,is_owner) VALUES($1,'Dr Ada','ada@example.test',$2,'active',true) RETURNING *",
      [a.id, passwordHash],
    )
  ).rows[0];
  for (const cap of capabilities)
    await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
      a.id,
      p.id,
      cap,
    ]);
  const client = (
    await c.query(
      "INSERT INTO clients(account_id,name) VALUES($1,'Synthetic Animal Owner') RETURNING id",
      [a.id],
    )
  ).rows[0];
  const patient = (
    await c.query(
      "INSERT INTO patients(account_id,client_id,name,species,breed,age) VALUES($1,$2,'Milo','Dog','Terrier','Age not recorded') RETURNING id",
      [a.id, client.id],
    )
  ).rows[0];
  const visit = (
    await c.query(
      "INSERT INTO visits(account_id,patient_id,responsible_id,state,ended_at) VALUES($1,$2,$3,'ended',now()) RETURNING id",
      [a.id, patient.id, p.id],
    )
  ).rows[0];
  await c.query(
    "INSERT INTO tasks(account_id,patient_id,visit_id,owner_id,kind,action,due_at) VALUES($1,$2,$3,$4,'follow_up','Check on Milo’s recovery',now()+interval '2 hours'),($1,$2,$3,$4,'task','Review pending result',now()-interval '1 hour')",
    [a.id, patient.id, visit.id, p.id],
  );
  await audit(c, p, "demo.created", "account", a.id);
});
await mkdir(".local", { recursive: true });
await writeFile(
  ".local/demo-login.json",
  JSON.stringify({ slug: "ellis-demo", email: "ada@example.test", password }),
  { mode: 0o600 },
);
console.log(
  "Synthetic local demo created. Credentials saved in ignored .local/demo-login.json.",
);
await pool.end();
