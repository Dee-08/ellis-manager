import { Router } from "express";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { pool, tx } from "./db.js";
import { requestContext } from "./context.js";
import { Problem } from "./domain.js";
import { z, parse, text, email, password } from "./validation.js";
import { mailAdapter, requireDelivery } from "./mail.js";
export const hashToken = (t) => createHash("sha256").update(t).digest("hex");
export const hash = (p) =>
  argon2.hash(p, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
export async function throttle(req, res, next) {
  try {
    const r = await pool.query(
      "INSERT INTO auth_limits(key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.hits+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END RETURNING hits",
      [hashToken(req.ip + "|" + req.path)],
    );
    if (r.rows[0].hits > 40)
      throw new Problem(429, "Too many attempts. Try again in 15 minutes.");
    next();
  } catch (e) {
    next(e);
  }
}
export async function sessionLogin(req, identity) {
  const pendingInvitation = req.session.pendingInvitation;
  await new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
  req.session.identityId = identity.id;
  req.session.identityVersion = identity.auth_version;
  req.session.createdAt = Date.now();
  if (pendingInvitation) req.session.pendingInvitation = pendingInvitation;
  await new Promise((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
}
export async function identified(req, res, next) {
  try {
    const s = req.session;
    if (!s?.identityId || Date.now() - s.createdAt > 12 * 3600000)
      throw new Problem(401, "Sign in to continue.", "authentication_required");
    const r = (
      await pool.query(
        "SELECT id,name,email,verified_at,intent,auth_version FROM identities WHERE id=$1",
        [s.identityId],
      )
    ).rows[0];
    if (!r || r.auth_version !== s.identityVersion)
      throw new Problem(
        401,
        "Your session has expired. Sign in again.",
        "session_expired",
      );
    req.identity = r;
    next();
  } catch (e) {
    next(e);
  }
}
export function verified(req, res, next) {
  if (!req.identity?.verified_at)
    return next(
      new Problem(
        403,
        "Verify your email before setting up or entering a practice.",
        "verification_required",
      ),
    );
  next();
}
export async function authenticated(req, res, next) {
  identified(req, res, (err) => {
    if (err) return next(err);
    verified(req, res, async (err) => {
      if (err) return next(err);
      try {
        let accountId = req.session.accountId;
        // Central origin remains the only cookie origin. Local tenant entry uses a
        // server-resolved address through /auth/select-workspace, never a raw ID.
        const r = await pool.query(
          "SELECT p.id,p.identity_id,p.account_id,p.name,p.email,p.title,p.is_owner,p.auth_version,a.kind,a.name AS practice_name,a.slug,a.timezone,a.country,a.currency,a.version AS account_version,COALESCE(array_agg(g.capability) FILTER(WHERE g.capability IS NOT NULL),'{}') AS capabilities FROM principals p JOIN accounts a ON a.id=p.account_id LEFT JOIN capability_grants g ON g.account_id=p.account_id AND g.principal_id=p.id WHERE p.identity_id=$1 AND p.account_id=$2 AND p.status='active' GROUP BY p.id,a.id",
          [req.identity.id, accountId || null],
        );
        if (!r.rowCount)
          throw new Problem(
            403,
            "Choose a practice you can access. Your membership may have changed.",
            "membership_required",
          );
        if (req.session.membershipVersion !== r.rows[0].auth_version)
          throw new Problem(
            401,
            "Your membership changed. Choose your practice again.",
            "membership_changed",
          );
        req.actor = {
          ...r.rows[0],
          identity_version: req.identity.auth_version,
        };
        requestContext.run(req.actor, () => next());
      } catch (e) {
        next(e);
      }
    });
  });
}
export async function nextDestination(identity, tenant, db = pool) {
  if (!identity.verified_at) return "/verify-email";
  if (tenant) {
    const r = await db.query(
      "SELECT a.slug FROM workspace_addresses w JOIN accounts a ON a.id=w.account_id JOIN principals p ON p.account_id=a.id WHERE w.slug=$1 AND p.identity_id=$2 AND p.status='active'",
      [tenant, identity.id],
    );
    if (!r.rowCount)
      throw new Problem(
        403,
        "You do not have access to this practice.",
        "membership_required",
      );
    return "/workspaces?tenant=" + encodeURIComponent(tenant);
  }
  const r = await db.query(
    "SELECT a.slug FROM principals p JOIN accounts a ON a.id=p.account_id WHERE p.identity_id=$1 AND p.status='active'",
    [identity.id],
  );
  return r.rowCount
    ? "/workspaces"
    : "/onboarding/" + (identity.intent || "personal");
}
async function tokenFor(c, identity, purpose) {
  const token = randomBytes(32).toString("hex");
  await c.query(
    "UPDATE identity_tokens SET consumed_at=now() WHERE identity_id=$1 AND purpose=$2 AND consumed_at IS NULL",
    [identity.id, purpose],
  );
  await c.query(
    "INSERT INTO identity_tokens(identity_id,purpose,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",
    [identity.id, purpose, hashToken(token)],
  );
  return token;
}
export function createAuth({ deliverMail = mailAdapter() } = {}) {
  const auth = Router();
  auth.post("/invitation-intent", throttle, async (req, res) => {
    const b = parse(z.object({ token: z.string().length(64) }), req.body);
    const invite = await pool.query(
      "SELECT 1 FROM invitations WHERE token_hash=$1 AND state='pending' AND expires_at>now()",
      [hashToken(b.token)],
    );
    if (!invite.rowCount)
      throw new Problem(400, "Invitation expired or unavailable.");
    req.session.pendingInvitation = b.token;
    await new Promise((resolve, reject) =>
      req.session.save((e) => (e ? reject(e) : resolve())),
    );
    res.json({
      next: req.session.identityId ? "/invitations/accept" : "/sign-in",
    });
  });
  auth.get("/configuration", (req, res) =>
    res.json({
      google: false,
      email: !!deliverMail,
      localMailbox:
        process.env.AUTH_MAIL_MODE === "local" &&
        process.env.NODE_ENV === "development",
    }),
  );
  auth.get("/session", identified, async (req, res) =>
    res.json({ ...req.identity, next: await nextDestination(req.identity) }),
  );
  auth.post("/register", throttle, async (req, res) => {
    requireDelivery(deliverMail);
    const b = parse(
      z.object({
        name: text,
        email,
        password,
        intent: z.enum(["personal", "clinic"]),
      }),
      req.body,
    );
    const passwordHash = await hash(b.password);
    const result = await tx(async (c) => {
      const i = (
        await c.query(
          "INSERT INTO identities(name,email,password_hash,intent) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING *",
          [b.name, b.email, passwordHash, b.intent],
        )
      ).rows[0];
      if (!i) return null;
      return { i, token: await tokenFor(c, i, "verify") };
    });
    if (result) {
      await sessionLogin(req, result.i);
      try {
        await deliverMail({
          to: b.email,
          purpose: "verify",
          url: process.env.APP_ORIGIN + "/verify-email#token=" + result.token,
        });
      } catch {
        throw new Problem(
          503,
          "Your registration is pending, but email delivery failed. Use resend verification.",
          "mail_failed",
        );
      }
    }
    res.status(202).json({
      next: "/verify-email",
      message:
        "Continue with email verification, or sign in if you already have an account.",
    });
  });
  auth.post("/verify", throttle, async (req, res) => {
    const b = parse(z.object({ token: z.string().length(64) }), req.body);
    const i = await tx(async (c) => {
      const t = (
        await c.query(
          "SELECT * FROM identity_tokens WHERE token_hash=$1 AND purpose='verify' FOR UPDATE",
          [hashToken(b.token)],
        )
      ).rows[0];
      if (!t || t.consumed_at || new Date(t.expires_at) < new Date())
        throw new Problem(
          400,
          "This link has expired or was already used. Sign in or request a new link.",
          "token_unavailable",
        );
      await c.query(
        "UPDATE identity_tokens SET consumed_at=now() WHERE id=$1",
        [t.id],
      );
      return (
        await c.query(
          "UPDATE identities SET verified_at=COALESCE(verified_at,now()) WHERE id=$1 RETURNING *",
          [t.identity_id],
        )
      ).rows[0];
    });
    await sessionLogin(req, i);
    res.json({
      next: req.session.pendingInvitation
        ? "/invitations/accept"
        : await nextDestination(i),
    });
  });
  auth.post("/resend", throttle, identified, async (req, res) => {
    requireDelivery(deliverMail);
    if (req.identity.verified_at)
      return res.json({ next: await nextDestination(req.identity) });
    const token = await tx((c) => tokenFor(c, req.identity, "verify"));
    try {
      await deliverMail({
        to: req.identity.email,
        purpose: "verify",
        url: process.env.APP_ORIGIN + "/verify-email#token=" + token,
      });
    } catch {
      throw new Problem(
        503,
        "Email delivery failed. Please retry.",
        "mail_failed",
      );
    }
    res.json({
      message:
        process.env.AUTH_MAIL_MODE === "local"
          ? "Verification saved to the local development mailbox."
          : "Verification sent.",
    });
  });
  auth.post("/login", throttle, async (req, res) => {
    const b = parse(
      z.object({
        email,
        password: z.string().min(1).max(128),
        tenant: z.string().max(50).optional(),
      }),
      req.body,
    );
    const i = (
      await pool.query("SELECT * FROM identities WHERE email=$1", [b.email])
    ).rows[0];
    const dummy =
      "$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$wvOD/3+YIw9GOxyAitwA51e3lRpqhGxZ52BHCg4c9cI";
    const valid = await argon2
      .verify(i?.password_hash || dummy, b.password)
      .catch(() => false);
    if (!i || !valid)
      throw new Problem(
        401,
        "Email or password is incorrect.",
        "invalid_credentials",
      );
    const next =
      i.verified_at && req.session.pendingInvitation
        ? "/invitations/accept"
        : await nextDestination(i, b.tenant);
    await sessionLogin(req, i);
    res.json({ next });
  });
  auth.post("/forgot-password", throttle, async (req, res) => {
    requireDelivery(deliverMail);
    const b = parse(z.object({ email }), req.body);
    const i = (
      await pool.query("SELECT * FROM identities WHERE email=$1", [b.email])
    ).rows[0];
    if (i) {
      const token = await tx((c) => tokenFor(c, i, "reset"));
      try {
        await deliverMail({
          to: i.email,
          purpose: "reset",
          url: process.env.APP_ORIGIN + "/reset-password#token=" + token,
        });
      } catch {
        throw new Problem(
          503,
          "Recovery delivery is temporarily unavailable. Please try again later.",
          "mail_failed",
        );
      }
    }
    res.json({
      message: "If this address has an account, a recovery link will be sent.",
    });
  });
  auth.post("/reset-password", throttle, async (req, res) => {
    const b = parse(
      z.object({ token: z.string().length(64), password }),
      req.body,
    );
    const passwordHash = await hash(b.password);
    await tx(async (c) => {
      const t = (
        await c.query(
          "SELECT * FROM identity_tokens WHERE token_hash=$1 AND purpose='reset' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
          [hashToken(b.token)],
        )
      ).rows[0];
      if (!t)
        throw new Problem(
          400,
          "This reset link is expired or already used.",
          "token_unavailable",
        );
      await c.query(
        "UPDATE identities SET password_hash=$1,auth_version=auth_version+1 WHERE id=$2",
        [passwordHash, t.identity_id],
      );
      await c.query(
        "UPDATE identity_tokens SET consumed_at=now() WHERE identity_id=$1 AND purpose='reset'",
        [t.identity_id],
      );
    });
    res.json({ next: "/sign-in" });
  });
  auth.post("/logout", (req, res, next) =>
    req.session.destroy((e) => {
      if (e) return next(e);
      res.clearCookie("ellis.sid", { path: "/" });
      res.json({ next: "/sign-in" });
    }),
  );
  auth.post("/google", (req, res) =>
    res.status(503).json({
      error: "Google sign-in is not configured. Use email and password.",
      code: "provider_unavailable",
    }),
  );
  return auth;
}
// Legacy activation links must not create a second identity/authentication path.
export async function activation() {
  throw new Problem(410, "Use a verified email invitation.");
}
