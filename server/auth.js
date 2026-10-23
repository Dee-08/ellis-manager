import { Router } from "express";
import { requestContext } from "./context.js";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { pool, tx, audit } from "./db.js";
import { Problem, capabilities } from "./domain.js";
import { z, parse, text, email, password, timezone } from "./validation.js";
export const hashToken = (t) => createHash("sha256").update(t).digest("hex");
const hash = (p) =>
  argon2.hash(p, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
export { hash };
export async function throttle(req, res, next) {
  try {
    const key = hashToken(req.ip + "|" + req.path);
    const r = await pool.query(
      "INSERT INTO auth_limits(key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.hits+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END RETURNING hits",
      [key],
    );
    if (r.rows[0].hits > 40)
      throw new Problem(
        429,
        "Too many attempts. Please try again in 15 minutes.",
      );
    next();
  } catch (e) {
    next(e);
  }
}
async function sessionLogin(req, p) {
  await new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
  req.session.principalId = p.id;
  req.session.accountId = p.account_id;
  req.session.authVersion = p.auth_version;
  req.session.createdAt = Date.now();
  await new Promise((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
}
export async function authenticated(req, res, next) {
  try {
    const s = req.session;
    if (!s?.principalId || Date.now() - s.createdAt > 12 * 3600000)
      throw new Problem(401, "Your session has expired. Sign in again.");
    const r = await pool.query(
      "SELECT p.id,p.account_id,p.name,p.email,p.title,p.is_owner,p.auth_version,a.kind,a.name AS practice_name,a.slug,a.timezone,a.version AS account_version,COALESCE(array_agg(g.capability) FILTER(WHERE g.capability IS NOT NULL),'{}') AS capabilities FROM principals p JOIN accounts a ON a.id=p.account_id LEFT JOIN capability_grants g ON g.account_id=p.account_id AND g.principal_id=p.id WHERE p.id=$1 AND p.account_id=$2 AND p.status='active' GROUP BY p.id,a.id",
      [s.principalId, s.accountId],
    );
    if (!r.rowCount || r.rows[0].auth_version !== s.authVersion)
      throw new Problem(401, "Your access has changed. Sign in again.");
    req.actor = r.rows[0];
    requestContext.run(req.actor, () => next());
  } catch (e) {
    next(e);
  }
}
export const auth = Router();
auth.post("/activation-info", throttle, async (req, res) => {
  const b = parse(z.object({ token: z.string().length(64) }), req.body);
  const r = (
    await pool.query(
      "SELECT a.name AS clinic,p.name FROM activation_tokens t JOIN accounts a ON a.id=t.account_id JOIN principals p ON p.account_id=t.account_id AND p.id=t.principal_id WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.expires_at>now() AND p.status='pending'",
      [hashToken(b.token)],
    )
  ).rows[0];
  if (!r)
    throw new Problem(400, "This activation link is expired or unavailable.");
  res.json(r);
});
const slug = z.string().regex(/^[a-z0-9-]{3,40}$/);
auth.post("/register", throttle, async (req, res) => {
  const b = parse(
    z.object({
      kind: z.enum(["personal", "clinic"]),
      practiceName: text,
      name: text,
      slug,
      email,
      password,
      timezone,
      clinical: z.enum(["on"]).optional(),
    }),
    req.body,
  );
  const passwordHash = await hash(b.password);
  const p = await tx(async (c) => {
    const account = (
      await c.query(
        "INSERT INTO accounts(kind,name,slug,timezone) VALUES($1,$2,$3,$4) RETURNING id",
        [b.kind, b.practiceName, b.slug, b.timezone],
      )
    ).rows[0];
    const principal = (
      await c.query(
        "INSERT INTO principals(account_id,name,email,password_hash,status,is_owner) VALUES($1,$2,$3,$4,'active',true) RETURNING *",
        [account.id, b.name, b.email, passwordHash],
      )
    ).rows[0];
    const grants = capabilities.filter(
      (x) => !x.startsWith("notes.") || b.clinical === "on",
    );
    for (const cap of grants)
      await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
        account.id,
        principal.id,
        cap,
      ]);
    await audit(c, principal, "account.created", "account", account.id, {
      kind: b.kind,
      clinical: b.clinical === "on",
    });
    return principal;
  });
  await sessionLogin(req, p);
  res.status(201).json({ ok: true });
});
auth.post("/login", throttle, async (req, res) => {
  const b = parse(
    z.object({ slug, email, password: z.string().min(1).max(128) }),
    req.body,
  );
  const p = (
    await pool.query(
      "SELECT p.* FROM principals p JOIN accounts a ON a.id=p.account_id WHERE a.slug=$1 AND p.email=$2 AND p.status='active'",
      [b.slug, b.email],
    )
  ).rows[0];
  if (!p?.password_hash || !(await argon2.verify(p.password_hash, b.password)))
    throw new Problem(401, "Practice code, email or password is incorrect.");
  await sessionLogin(req, p);
  res.json({ ok: true });
});
auth.post("/logout", (req, res, next) =>
  req.session.destroy((e) => {
    if (e) return next(e);
    res.clearCookie("ellis.sid", { path: "/" });
    res.json({ ok: true });
  }),
);
auth.post("/activate", throttle, async (req, res) => {
  const b = parse(
    z.object({ token: z.string().length(64), password }),
    req.body,
  );
  const passwordHash = await hash(b.password);
  const p = await tx(async (c) => {
    const token = (
      await c.query(
        "SELECT * FROM activation_tokens WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
        [hashToken(b.token)],
      )
    ).rows[0];
    if (!token)
      throw new Problem(
        400,
        "This activation link is expired or unavailable. Ask your clinic administrator for a new link.",
      );
    const principal = (
      await c.query(
        "UPDATE principals SET password_hash=$1,status='active',auth_version=auth_version+1 WHERE account_id=$2 AND id=$3 AND status='pending' RETURNING *",
        [passwordHash, token.account_id, token.principal_id],
      )
    ).rows[0];
    if (!principal)
      throw new Problem(400, "This activation link is unavailable.");
    await c.query(
      "UPDATE activation_tokens SET consumed_at=now() WHERE id=$1",
      [token.id],
    );
    await audit(c, principal, "staff.activated", "principal", principal.id);
    return principal;
  });
  await sessionLogin(req, p);
  res.json({ ok: true });
});
export async function activation(c, p) {
  const token = randomBytes(32).toString("hex");
  await c.query(
    "UPDATE activation_tokens SET consumed_at=now() WHERE account_id=$1 AND principal_id=$2 AND consumed_at IS NULL",
    [p.account_id, p.id],
  );
  await c.query(
    "INSERT INTO activation_tokens(account_id,principal_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')",
    [p.account_id, p.id, hashToken(token)],
  );
  return token;
}
