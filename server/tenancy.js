import { Router } from "express";
import { randomBytes } from "node:crypto";
import { pool, tx, audit } from "./db.js";
import { identified, verified, authenticated, hashToken } from "./auth.js";
import { z, parse, text, timezone, uuid, email } from "./validation.js";
import { capabilities, Problem, requireCap } from "./domain.js";
import { mailAdapter, requireDelivery } from "./mail.js";
const reserved = new Set([
  "www",
  "app",
  "auth",
  "api",
  "admin",
  "support",
  "mail",
  "static",
  "system",
  "help",
  "billing",
  "login",
]);
export const address = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,48})[a-z0-9]$/)
  .refine((s) => !reserved.has(s), "This address is reserved.");
export function ownerCapabilities(clinical) {
  return capabilities.filter(
    (c) =>
      clinical ||
      !["notes.view", "notes.draft", "notes.sign", "visits.manage"].includes(c),
  );
}
const membershipSql =
  "SELECT a.id,a.name,a.kind,a.slug,a.country,a.timezone,a.currency,p.id AS membership_id,p.is_owner FROM principals p JOIN accounts a ON a.id=p.account_id WHERE p.identity_id=$1 AND p.status='active' ORDER BY a.name";
export function createTenancy({ deliverMail = mailAdapter() } = {}) {
  const router = Router();
  router.use(identified, verified);
  router.get("/workspaces", async (req, res) =>
    res.json((await pool.query(membershipSql, [req.identity.id])).rows),
  );
  router.post("/workspaces/select", async (req, res) => {
    const b = parse(z.object({ slug: address }), req.body);
    const a = (
      await pool.query(
        "SELECT a.id,p.auth_version FROM workspace_addresses w JOIN accounts a ON a.id=w.account_id JOIN principals p ON p.account_id=a.id WHERE w.slug=$1 AND p.identity_id=$2 AND p.status='active'",
        [b.slug, req.identity.id],
      )
    ).rows[0];
    if (!a)
      throw new Problem(
        403,
        "You do not have access to this practice.",
        "membership_required",
      );
    req.session.accountId = a.id;
    req.session.membershipVersion = a.auth_version;
    await new Promise((resolve, reject) =>
      req.session.save((e) => (e ? reject(e) : resolve())),
    );
    res.json({ next: "/app/today" });
  });
  router.post("/workspaces", async (req, res) => {
    const b = parse(
      z.object({
        kind: z.enum(["personal", "clinic"]),
        name: z.string().trim().max(120).default(""),
        slug: address,
        country: z.string().regex(/^[A-Z]{2}$/),
        currency: z.string().regex(/^[A-Z]{3}$/),
        timezone,
        clinical: z.boolean().default(false),
        key: uuid,
      }),
      req.body,
    );
    if (b.kind === "clinic" && !b.name)
      throw new Problem(400, "Enter your clinic name.");
    const fingerprint = hashToken(JSON.stringify(b));
    const a = await tx(async (c) => {
      const i = (
        await c.query("SELECT * FROM identities WHERE id=$1 FOR UPDATE", [
          req.identity.id,
        ])
      ).rows[0];
      if (!i.verified_at || i.auth_version !== req.identity.auth_version)
        throw new Problem(401, "Sign in again.");
      const previous = (
        await c.query(
          "SELECT * FROM workspace_commands WHERE identity_id=$1 AND operation='create' AND key=$2",
          [i.id, b.key],
        )
      ).rows[0];
      if (previous) {
        if (previous.payload_hash !== fingerprint)
          throw new Problem(
            409,
            "This request key was already used for different details.",
            "idempotency_conflict",
          );
        return (
          await c.query("SELECT * FROM accounts WHERE id=$1", [
            previous.account_id,
          ])
        ).rows[0];
      }
      const a = (
        await c.query(
          "INSERT INTO accounts(kind,name,slug,timezone,country,currency) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            b.kind,
            b.name || i.name + "’s practice",
            b.slug,
            b.timezone,
            b.country,
            b.currency,
          ],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO workspace_addresses(slug,account_id) VALUES($1,$2)",
        [b.slug, a.id],
      );
      const p = (
        await c.query(
          "INSERT INTO principals(account_id,identity_id,name,email,status,is_owner) VALUES($1,$2,$3,$4,'active',true) RETURNING *",
          [a.id, i.id, i.name, i.email],
        )
      ).rows[0];
      for (const cap of ownerCapabilities(b.kind === "personal" || b.clinical))
        await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
          a.id,
          p.id,
          cap,
        ]);
      await audit(c, p, "workspace.created", "account", a.id, {
        kind: b.kind,
        clinical: b.kind === "personal" || b.clinical,
      });
      await c.query(
        "INSERT INTO workspace_commands VALUES($1,'create',$2,$3,$4)",
        [i.id, b.key, fingerprint, a.id],
      );
      return a;
    });
    req.session.accountId = a.id;
    req.session.membershipVersion = 1;
    await new Promise((resolve, reject) =>
      req.session.save((e) => (e ? reject(e) : resolve())),
    );
    res.status(201).json({ workspace: a, next: "/app/today" });
  });
  router.post("/invitations/accept", async (req, res) => {
    const b = parse(
      z.object({ token: z.string().length(64).optional() }),
      req.body,
    );
    b.token = b.token || req.session.pendingInvitation;
    if (!b.token) throw new Problem(400, "Open your invitation link first.");
    const result = await tx(async (c) => {
      const initial = (
        await c.query(
          "SELECT account_id FROM invitations WHERE token_hash=$1",
          [hashToken(b.token)],
        )
      ).rows[0];
      if (!initial)
        throw new Problem(
          400,
          "Invitation unavailable.",
          "invitation_unavailable",
        );
      await c.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [
        initial.account_id,
      ]);
      const invite = (
        await c.query(
          "SELECT * FROM invitations WHERE token_hash=$1 FOR UPDATE",
          [hashToken(b.token)],
        )
      ).rows[0];
      if (invite.email !== req.identity.email)
        throw new Problem(
          403,
          "Sign in with the email address that was invited.",
          "invitation_identity_mismatch",
        );
      if (
        invite.state === "accepted" &&
        invite.accepted_by === req.identity.id
      ) {
        const member = await c.query(
          "SELECT 1 FROM principals WHERE account_id=$1 AND identity_id=$2 AND status='active'",
          [invite.account_id, req.identity.id],
        );
        if (!member.rowCount)
          throw new Problem(403, "Your clinic membership is no longer active.");
        return invite.account_id;
      }
      if (
        invite.state !== "pending" ||
        new Date(invite.expires_at) < new Date()
      )
        throw new Problem(
          400,
          "Invitation expired or revoked.",
          "invitation_expired",
        );
      const inviter = (
        await c.query(
          "SELECT p.id FROM principals p JOIN capability_grants g ON g.principal_id=p.id AND g.account_id=p.account_id WHERE p.id=$1 AND p.account_id=$2 AND p.status='active' AND g.capability='staff.manage'",
          [invite.invited_by, invite.account_id],
        )
      ).rows[0];
      if (!inviter)
        throw new Problem(
          403,
          "Invitation needs to be reissued by an active administrator.",
        );
      const p = (
        await c.query(
          "INSERT INTO principals(account_id,identity_id,name,email,title,status) VALUES($1,$2,$3,$4,$5,'active') ON CONFLICT(account_id,identity_id) WHERE identity_id IS NOT NULL DO NOTHING RETURNING *",
          [
            invite.account_id,
            req.identity.id,
            req.identity.name,
            req.identity.email,
            invite.title,
          ],
        )
      ).rows[0];
      if (!p)
        throw new Problem(
          409,
          "Membership already exists. Ask an administrator to review access.",
        );
      const current = (
        await c.query(
          "SELECT capability FROM capability_grants WHERE account_id=$1 AND principal_id=$2",
          [invite.account_id, invite.invited_by],
        )
      ).rows.map((x) => x.capability);
      if (invite.capabilities.some((x) => !current.includes(x)))
        throw new Problem(
          403,
          "Inviter permissions have changed. Request a new invitation.",
        );
      for (const cap of invite.capabilities)
        await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
          invite.account_id,
          p.id,
          cap,
        ]);
      await c.query(
        "UPDATE invitations SET state='accepted',accepted_by=$1 WHERE id=$2",
        [req.identity.id, invite.id],
      );
      await audit(c, p, "invitation.accepted", "principal", p.id);
      return invite.account_id;
    });
    req.session.accountId = result;
    req.session.membershipVersion = (
      await pool.query(
        "SELECT auth_version FROM principals WHERE account_id=$1 AND identity_id=$2 AND status='active'",
        [result, req.identity.id],
      )
    ).rows[0]?.auth_version;
    delete req.session.pendingInvitation;
    res.json({ next: "/app/today" });
  });
  router.post("/workspace/convert", authenticated, async (req, res) => {
    const b = parse(
      z.object({
        name: text,
        slug: address.optional(),
        version: z.number().int().positive(),
        confirmed: z.literal(true),
      }),
      req.body,
    );
    res.json(
      await tx(async (c) => {
        const p = (
          await c.query(
            "SELECT is_owner FROM principals WHERE id=$1 AND account_id=$2 AND status='active'",
            [req.actor.id, req.actor.account_id],
          )
        ).rows[0];
        if (!p?.is_owner)
          throw new Problem(
            403,
            "Only the active owner can switch practice type.",
            "permission_denied",
          );
        const a = (
          await c.query("SELECT * FROM accounts WHERE id=$1 FOR UPDATE", [
            req.actor.account_id,
          ])
        ).rows[0];
        if (a.kind === "clinic") return a;
        if (a.version !== b.version)
          throw new Problem(
            409,
            "Practice settings changed. Review the latest details.",
            "stale_revision",
          );
        const slug = b.slug || a.slug;
        if (slug !== a.slug) {
          // Claim first; any collision rolls the entire transaction back.
          await c.query(
            "INSERT INTO workspace_addresses(slug,account_id,is_canonical) VALUES($1,$2,false)",
            [slug, a.id],
          );
          await c.query(
            "UPDATE workspace_addresses SET is_canonical=false WHERE account_id=$1",
            [a.id],
          );
          await c.query(
            "UPDATE workspace_addresses SET is_canonical=true WHERE slug=$1",
            [slug],
          );
        }
        const result = (
          await c.query(
            "UPDATE accounts SET kind='clinic',name=$1,slug=$2,converted_at=now(),version=version+1 WHERE id=$3 RETURNING *",
            [b.name, slug, a.id],
          )
        ).rows[0];
        await audit(c, req.actor, "workspace.converted", "account", a.id, {
          previousSlug: a.slug,
          slug,
        });
        return result;
      }),
    );
  });
  router.post("/invitations", authenticated, async (req, res) => {
    if (req.actor.kind !== "clinic")
      throw new Problem(
        403,
        "Use Settings → Practice type to explicitly switch to a clinic before inviting staff.",
        "clinic_mode_required",
      );
    requireCap(req.actor, "staff.manage");
    requireDelivery(deliverMail);
    const b = parse(
      z.object({
        email,
        title: z.string().max(120).default(""),
        capabilities: z.array(z.enum(capabilities)).max(30),
      }),
      req.body,
    );
    if (b.capabilities.some((c) => !req.actor.capabilities.includes(c)))
      throw new Problem(
        403,
        "You cannot grant a permission you do not hold.",
        "permission_denied",
      );
    const token = randomBytes(32).toString("hex");
    const invite = await tx(async (c) => {
      const existing = await c.query(
        "SELECT 1 FROM principals WHERE account_id=$1 AND email=$2",
        [req.actor.account_id, b.email],
      );
      if (existing.rowCount)
        throw new Problem(
          409,
          "This person already has a membership. Review their existing access.",
        );
      const r = (
        await c.query(
          "INSERT INTO invitations(account_id,email,title,capabilities,token_hash,expires_at,invited_by) VALUES($1,$2,$3,$4,$5,now()+interval '7 days',$6) RETURNING id",
          [
            req.actor.account_id,
            b.email,
            b.title,
            [...new Set(b.capabilities)],
            hashToken(token),
            req.actor.id,
          ],
        )
      ).rows[0];
      await audit(c, req.actor, "invitation.created", "invitation", r.id);
      return r;
    });
    try {
      await deliverMail({
        to: b.email,
        purpose: "invitation",
        url: process.env.APP_ORIGIN + "/invitations/accept#token=" + token,
      });
    } catch {
      throw new Problem(
        503,
        "Invitation saved, but delivery failed. Ask an administrator to revoke it before retrying.",
        "mail_failed",
      );
    }
    await pool.query("UPDATE invitations SET delivered_at=now() WHERE id=$1", [
      invite.id,
    ]);
    res.status(201).json({
      id: invite.id,
      delivery:
        process.env.AUTH_MAIL_MODE === "local" ? "local_mailbox" : "sent",
    });
  });
  router.get("/invitations", authenticated, async (req, res) => {
    requireCap(req.actor, "staff.manage");
    if (req.actor.kind !== "clinic")
      throw new Problem(403, "Clinic mode required.", "clinic_mode_required");
    res.json(
      (
        await pool.query(
          "SELECT id,email,title,state,expires_at,delivered_at FROM invitations WHERE account_id=$1 ORDER BY expires_at DESC",
          [req.actor.account_id],
        )
      ).rows,
    );
  });
  router.post("/invitations/:id/revoke", authenticated, async (req, res) => {
    requireCap(req.actor, "staff.manage");
    uuid.parse(req.params.id);
    await tx(async (c) => {
      const r = await c.query(
        "UPDATE invitations SET state='revoked' WHERE id=$1 AND account_id=$2 AND state='pending' RETURNING id",
        [req.params.id, req.actor.account_id],
      );
      if (!r.rowCount)
        throw new Problem(409, "Invitation is no longer pending.");
      await audit(
        c,
        req.actor,
        "invitation.revoked",
        "invitation",
        req.params.id,
      );
    });
    res.json({ ok: true });
  });
  return router;
}
