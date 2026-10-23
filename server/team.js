import { Router } from "express";
import { pool, tx, audit } from "./db.js";
import { Problem, requireCap, capabilities, version } from "./domain.js";
import { activation } from "./auth.js";
import {
  z,
  parse,
  text,
  optional,
  email,
  uuid,
  timezone,
  ver,
  page,
} from "./validation.js";
import { owned } from "./records.js";
export const team = Router();
team.get("/export", async (req, res) => {
  requireCap(req.actor, "data.export");
  const b = z
    .object({
      type: z.enum([
        "patients",
        "clients",
        "visits",
        "notes",
        "tasks",
        "contact_attempts",
        "audit_events",
      ]),
      offset: z.coerce.number().int().min(0).max(100000).default(0),
    })
    .parse(req.query);
  const caps = {
    patients: ["patients.view"],
    clients: ["patients.view"],
    visits: ["patients.view"],
    notes: ["patients.view", "notes.view"],
    tasks: ["tasks.team"],
    contact_attempts: ["tasks.team"],
    audit_events: ["audit.view"],
  };
  for (const cap of caps[b.type]) requireCap(req.actor, cap);
  const rows = (
    await pool.query(
      `SELECT * FROM ${b.type} WHERE account_id=$1 ORDER BY id LIMIT 500 OFFSET $2`,
      [req.actor.account_id, b.offset],
    )
  ).rows;
  res.set(
    "Content-Disposition",
    `attachment; filename="ellis-${b.type}-${b.offset}.json"`,
  );
  res.json({
    type: b.type,
    offset: b.offset,
    nextOffset: rows.length === 500 ? b.offset + 500 : null,
    records: rows,
  });
});
function clinic(actor) {
  if (actor.kind !== "clinic")
    throw new Problem(
      403,
      "Staff management is available only in clinic accounts.",
    );
  requireCap(actor, "staff.manage");
}
function grants(actor, caps) {
  if (caps.some((x) => !actor.capabilities.includes(x)))
    throw new Problem(403, "You cannot grant a permission you do not hold.");
  if (caps.some((x) => x.startsWith("notes.")) && !caps.includes("notes.view"))
    throw new Problem(
      400,
      "Note permissions also require permission to view notes.",
    );
}
team.get("/people", async (req, res) => {
  if (
    !req.actor.capabilities.includes("tasks.create") &&
    !req.actor.capabilities.includes("staff.manage")
  )
    throw new Problem(403, "Permission required.");
  res.json(
    (
      await pool.query(
        "SELECT id,name,title FROM principals WHERE account_id=$1 AND status='active' ORDER BY name LIMIT 200",
        [req.actor.account_id],
      )
    ).rows,
  );
});
team.get("/team", async (req, res) => {
  clinic(req.actor);
  res.json(
    (
      await pool.query(
        "SELECT p.id,p.name,p.email,p.title,p.status,p.is_owner,p.auth_version,COALESCE(array_agg(g.capability) FILTER(WHERE g.capability IS NOT NULL),'{}') AS capabilities,(SELECT count(*)::int FROM tasks t WHERE t.account_id=p.account_id AND t.owner_id=p.id AND t.status NOT IN ('completed','cancelled')) AS open_work FROM principals p LEFT JOIN capability_grants g ON g.account_id=p.account_id AND g.principal_id=p.id WHERE p.account_id=$1 GROUP BY p.id ORDER BY p.is_owner DESC,p.name LIMIT 200",
        [req.actor.account_id],
      )
    ).rows,
  );
});
team.post("/team", async (req, res) => {
  clinic(req.actor);
  const b = parse(
    z.object({
      name: text,
      email,
      title: optional,
      capabilities: z.array(z.enum(capabilities)).max(20),
    }),
    req.body,
  );
  grants(req.actor, b.capabilities);
  res.status(201).json(
    await tx(async (c) => {
      const p = (
        await c.query(
          "INSERT INTO principals(account_id,name,email,title,status) VALUES($1,$2,$3,$4,'pending') RETURNING *",
          [req.actor.account_id, b.name, b.email, b.title],
        )
      ).rows[0];
      for (const cap of new Set(b.capabilities))
        await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
          req.actor.account_id,
          p.id,
          cap,
        ]);
      const token = await activation(c, p);
      await audit(c, req.actor, "staff.invited", "principal", p.id, {
        capabilities: b.capabilities,
      });
      return {
        id: p.id,
        activationLink: process.env.APP_ORIGIN + "/activate#token=" + token,
        delivered: false,
      };
    }),
  );
});
team.post("/team/:id/rotate", async (req, res) => {
  clinic(req.actor);
  parse(z.object({}), req.body);
  res.json(
    await tx(async (c) => {
      const p = await owned(c, "principals", req.actor, req.params.id, true);
      if (p.is_owner || p.id === req.actor.id || p.status === "disabled")
        throw new Problem(409, "This account cannot be reactivated here.");
      await c.query(
        "UPDATE principals SET status='pending',auth_version=auth_version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, p.id],
      );
      const token = await activation(c, p);
      await audit(c, req.actor, "staff.activation_rotated", "principal", p.id);
      return {
        activationLink: process.env.APP_ORIGIN + "/activate#token=" + token,
        delivered: false,
      };
    }),
  );
});
team.patch("/team/:id", async (req, res) => {
  clinic(req.actor);
  const b = parse(
    z.object({
      capabilities: z.array(z.enum(capabilities)).max(20),
      title: optional,
      version: ver,
    }),
    req.body,
  );
  grants(req.actor, b.capabilities);
  res.json(
    await tx(async (c) => {
      const p = await owned(c, "principals", req.actor, req.params.id, true);
      version({ version: p.auth_version }, b.version);
      if (p.is_owner || p.id === req.actor.id)
        throw new Problem(409, "Use owner safeguards for this account.");
      await c.query(
        "DELETE FROM capability_grants WHERE account_id=$1 AND principal_id=$2",
        [req.actor.account_id, p.id],
      );
      for (const cap of new Set(b.capabilities))
        await c.query("INSERT INTO capability_grants VALUES($1,$2,$3)", [
          req.actor.account_id,
          p.id,
          cap,
        ]);
      await c.query(
        "UPDATE principals SET title=$1,auth_version=auth_version+1 WHERE account_id=$2 AND id=$3",
        [b.title, req.actor.account_id, p.id],
      );
      await audit(
        c,
        req.actor,
        "staff.permissions_changed",
        "principal",
        p.id,
        { capabilities: b.capabilities },
      );
      return { ok: true };
    }),
  );
});
team.post("/team/:id/disable", async (req, res) => {
  clinic(req.actor);
  const b = parse(
    z.object({ reason: text, reviewed: z.literal(true), version: ver }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const p = await owned(c, "principals", req.actor, req.params.id, true);
      version({ version: p.auth_version }, b.version);
      if (p.is_owner || p.id === req.actor.id)
        throw new Problem(
          409,
          "Transfer ownership before disabling the owner.",
        );
      const owner = (
        await c.query(
          "SELECT id FROM principals WHERE account_id=$1 AND is_owner AND status='active'",
          [req.actor.account_id],
        )
      ).rows[0];
      await c.query(
        "UPDATE principals SET status='disabled',auth_version=auth_version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, p.id],
      );
      await c.query(
        "UPDATE activation_tokens SET consumed_at=now() WHERE account_id=$1 AND principal_id=$2 AND consumed_at IS NULL",
        [req.actor.account_id, p.id],
      );
      const tasks = await c.query(
        "UPDATE tasks SET owner_id=$1,reason='Escalated after staff access revocation',version=version+1 WHERE account_id=$2 AND owner_id=$3 AND status NOT IN ('completed','cancelled') RETURNING id",
        [owner.id, req.actor.account_id, p.id],
      );
      await c.query(
        "UPDATE handovers SET state='cancelled',decided_at=now() WHERE account_id=$1 AND (from_id=$2 OR to_id=$2) AND state='pending'",
        [req.actor.account_id, p.id],
      );
      for (const t of tasks.rows)
        await audit(c, req.actor, "task.escalated", "task", t.id, {
          from: p.id,
          to: owner.id,
        });
      await audit(c, req.actor, "staff.disabled", "principal", p.id, {
        reason: b.reason,
        escalated: tasks.rowCount,
      });
      return { ok: true, escalated: tasks.rowCount };
    }),
  );
});
team.post("/ownership/transfer", async (req, res) => {
  clinic(req.actor);
  if (!req.actor.is_owner)
    throw new Problem(403, "Only the clinic owner can transfer ownership.");
  const b = parse(z.object({ toId: uuid, confirmation: text }), req.body);
  if (b.confirmation !== req.actor.slug)
    throw new Problem(400, "Enter the practice code to confirm.");
  res.json(
    await tx(async (c) => {
      await c.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [
        req.actor.account_id,
      ]);
      const current = await owned(
        c,
        "principals",
        req.actor,
        req.actor.id,
        true,
      );
      if (!current.is_owner) throw new Problem(409, "Ownership has changed.");
      const p = await owned(c, "principals", req.actor, b.toId, true);
      if (p.status !== "active" || p.id === req.actor.id)
        throw new Problem(400, "Choose another active principal.");
      await c.query(
        "UPDATE principals SET is_owner=false,auth_version=auth_version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, current.id],
      );
      await c.query(
        "UPDATE principals SET is_owner=true,auth_version=auth_version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, p.id],
      );
      for (const cap of capabilities.filter((x) => !x.startsWith("notes.")))
        await c.query(
          "INSERT INTO capability_grants VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [req.actor.account_id, p.id, cap],
        );
      await audit(
        c,
        req.actor,
        "ownership.transferred",
        "account",
        req.actor.account_id,
        { from: current.id, to: p.id },
      );
      return { ok: true };
    }),
  );
});
team.patch("/settings", async (req, res) => {
  requireCap(req.actor, "settings.manage");
  const b = parse(z.object({ name: text, timezone, version: ver }), req.body);
  res.json(
    await tx(async (c) => {
      const a = (
        await c.query("SELECT * FROM accounts WHERE id=$1 FOR UPDATE", [
          req.actor.account_id,
        ])
      ).rows[0];
      version(a, b.version);
      await c.query(
        "UPDATE accounts SET name=$1,timezone=$2,version=version+1 WHERE id=$3",
        [b.name, b.timezone, a.id],
      );
      await audit(c, req.actor, "settings.updated", "account", a.id);
      return { ok: true };
    }),
  );
});
team.get("/audit", async (req, res) => {
  requireCap(req.actor, "audit.view");
  const { offset } = page(req.query);
  res.json(
    (
      await pool.query(
        "SELECT a.*,p.name AS actor_name FROM audit_events a JOIN principals p ON p.account_id=a.account_id AND p.id=a.actor_id WHERE a.account_id=$1 ORDER BY a.id DESC LIMIT 50 OFFSET $2",
        [req.actor.account_id, offset],
      )
    ).rows,
  );
});
