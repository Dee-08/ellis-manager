import { Router } from "express";
import { pool, tx, audit } from "./db.js";
import { Problem, requireCap, version, taskTransition } from "./domain.js";
import { z, parse, text, optional, uuid, ver, page } from "./validation.js";
import { owned } from "./records.js";
export const work = Router();
work.patch("/tasks/:id", async (req, res) => {
  requireCap(req.actor, "tasks.create");
  const b = parse(
    z.object({
      action: text,
      dueAt: z.iso.datetime({ offset: true }).nullable(),
      version: ver,
    }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const t = await owned(c, "tasks", req.actor, req.params.id, true);
      taskAccess(req.actor, t);
      if (t.owner_id !== req.actor.id) requireCap(req.actor, "tasks.reassign");
      version(t, b.version);
      if (["completed", "cancelled"].includes(t.status))
        throw new Problem(
          409,
          "Reopen the task before editing its action or deadline.",
        );
      const r = (
        await c.query(
          "UPDATE tasks SET action=$1,due_at=$2,version=version+1 WHERE account_id=$3 AND id=$4 RETURNING *",
          [b.action, b.dueAt, req.actor.account_id, t.id],
        )
      ).rows[0];
      await audit(c, req.actor, "task.updated", "task", t.id);
      return r;
    }),
  );
});
function taskAccess(actor, t) {
  if (t.owner_id !== actor.id && !actor.capabilities.includes("tasks.team"))
    throw new Problem(404, "Record not found.");
}
work.get("/tasks", async (req, res) => {
  const { offset } = page(req.query);
  const f = z
    .object({
      view: z.enum(["all", "open", "mine", "today"]).default("all"),
      kind: z.enum(["all", "follow_up"]).default("all"),
    })
    .parse(req.query);
  const team = req.actor.capabilities.includes("tasks.team");
  res.json(
    (
      await pool.query(
        "SELECT t.*,p.name AS owner_name,CASE WHEN $4 THEN a.name ELSE NULL END AS patient_name, (t.due_at<now() AND t.status NOT IN ('completed','cancelled')) AS overdue FROM tasks t JOIN principals p ON p.account_id=t.account_id AND p.id=t.owner_id LEFT JOIN patients a ON a.account_id=t.account_id AND a.id=t.patient_id WHERE t.account_id=$1 AND ($2 OR t.owner_id=$3) AND ($6='all' OR t.kind=$6) AND ($7='all' OR ($7='mine' AND t.owner_id=$3) OR ($7='open' AND t.status NOT IN ('completed','cancelled')) OR ($7='today' AND t.status NOT IN ('completed','cancelled') AND (t.due_at AT TIME ZONE $8)::date=(now() AT TIME ZONE $8)::date)) ORDER BY CASE WHEN t.status IN ('completed','cancelled') THEN 1 ELSE 0 END,t.due_at NULLS LAST,t.created_at DESC,t.id LIMIT 50 OFFSET $5",
        [
          req.actor.account_id,
          team,
          req.actor.id,
          req.actor.capabilities.includes("patients.view"),
          offset,
          f.kind,
          f.view,
          req.actor.timezone,
        ],
      )
    ).rows,
  );
});
work.post("/tasks", async (req, res) => {
  requireCap(req.actor, "tasks.create");
  const b = parse(
    z.object({
      action: text,
      kind: z.enum(["task", "follow_up"]),
      patientId: uuid.optional(),
      visitId: uuid.optional(),
      dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
    }),
    req.body,
  );
  res.status(201).json(
    await tx(async (c) => {
      if (b.patientId) {
        requireCap(req.actor, "patients.view");
        await owned(c, "patients", req.actor, b.patientId);
      }
      if (b.visitId) {
        const v = await owned(c, "visits", req.actor, b.visitId);
        if (v.patient_id !== b.patientId)
          throw new Problem(400, "Select the patient for this visit.");
      }
      const t = (
        await c.query(
          "INSERT INTO tasks(account_id,patient_id,visit_id,owner_id,kind,action,due_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
          [
            req.actor.account_id,
            b.patientId || null,
            b.visitId || null,
            req.actor.id,
            b.kind,
            b.action,
            b.dueAt || null,
          ],
        )
      ).rows[0];
      await audit(c, req.actor, "task.created", "task", t.id);
      return t;
    }),
  );
});
work.get("/tasks/:id", async (req, res) => {
  const t = await owned(pool, "tasks", req.actor, req.params.id);
  taskAccess(req.actor, t);
  const attempts = (
    await pool.query(
      "SELECT c.*,p.name AS actor_name FROM contact_attempts c JOIN principals p ON p.account_id=c.account_id AND p.id=c.actor_id WHERE c.account_id=$1 AND task_id=$2 ORDER BY created_at DESC LIMIT 100",
      [req.actor.account_id, t.id],
    )
  ).rows;
  res.json({ ...t, attempts });
});
work.post("/tasks/:id/state", async (req, res) => {
  requireCap(req.actor, "tasks.complete");
  const b = parse(
    z.object({
      status: z.enum([
        "open",
        "in_progress",
        "blocked",
        "completed",
        "cancelled",
      ]),
      reason: optional,
      version: ver,
    }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const t = await owned(c, "tasks", req.actor, req.params.id, true);
      taskAccess(req.actor, t);
      if (t.owner_id !== req.actor.id) requireCap(req.actor, "tasks.reassign");
      version(t, b.version);
      taskTransition(t.status, b.status, b.reason);
      const r = (
        await c.query(
          "UPDATE tasks SET status=$1,reason=$2,completed_at=CASE WHEN $1='completed' THEN now() ELSE NULL END,completed_by=CASE WHEN $1='completed' THEN $3::uuid ELSE NULL END,version=version+1 WHERE account_id=$4 AND id=$5 RETURNING *",
          [b.status, b.reason, req.actor.id, req.actor.account_id, t.id],
        )
      ).rows[0];
      if (["completed", "cancelled"].includes(b.status))
        await c.query(
          "UPDATE handovers SET state='cancelled',decided_at=now() WHERE account_id=$1 AND task_id=$2 AND state='pending'",
          [req.actor.account_id, t.id],
        );
      await audit(c, req.actor, "task." + b.status, "task", t.id, {
        reason: b.reason,
      });
      return r;
    }),
  );
});
work.post("/tasks/:id/contact", async (req, res) => {
  requireCap(req.actor, "tasks.complete");
  const b = parse(
    z.object({
      channel: z.enum(["phone", "in_person", "email", "other"]),
      outcome: text,
      note: optional,
      version: ver,
    }),
    req.body,
  );
  res.status(201).json(
    await tx(async (c) => {
      const t = await owned(c, "tasks", req.actor, req.params.id, true);
      taskAccess(req.actor, t);
      if (t.owner_id !== req.actor.id) requireCap(req.actor, "tasks.reassign");
      version(t, b.version);
      if (
        t.kind !== "follow_up" ||
        ["completed", "cancelled"].includes(t.status)
      )
        throw new Problem(409, "Contact attempts require an open follow-up.");
      const r = (
        await c.query(
          "INSERT INTO contact_attempts(account_id,task_id,actor_id,channel,outcome,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            req.actor.account_id,
            t.id,
            req.actor.id,
            b.channel,
            b.outcome,
            b.note,
          ],
        )
      ).rows[0];
      await c.query(
        "UPDATE tasks SET version=version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, t.id],
      );
      await audit(c, req.actor, "follow_up.contact_recorded", "task", t.id, {
        channel: b.channel,
      });
      return r;
    }),
  );
});
work.get("/handovers", async (req, res) =>
  res.json(
    (
      await pool.query(
        "SELECT h.*,t.action,p.name AS from_name,r.name AS to_name FROM handovers h JOIN tasks t ON t.account_id=h.account_id AND t.id=h.task_id JOIN principals p ON p.account_id=h.account_id AND p.id=h.from_id JOIN principals r ON r.account_id=h.account_id AND r.id=h.to_id WHERE h.account_id=$1 AND h.state='pending' AND (h.to_id=$2 OR h.from_id=$2) ORDER BY h.created_at LIMIT 100",
        [req.actor.account_id, req.actor.id],
      )
    ).rows,
  ),
);
work.post("/tasks/:id/handover", async (req, res) => {
  requireCap(req.actor, "tasks.create");
  const b = parse(z.object({ toId: uuid, version: ver }), req.body);
  res.status(201).json(
    await tx(async (c) => {
      const t = await owned(c, "tasks", req.actor, req.params.id, true);
      if (t.owner_id !== req.actor.id)
        throw new Problem(
          403,
          "Only the accountable owner can offer this handover.",
        );
      version(t, b.version);
      if (["completed", "cancelled"].includes(t.status))
        throw new Problem(409, "This task is closed.");
      const p = await owned(c, "principals", req.actor, b.toId, true);
      if (p.status !== "active" || p.id === req.actor.id)
        throw new Problem(400, "Choose another active staff member.");
      if (
        !(
          await c.query(
            "SELECT 1 FROM capability_grants WHERE account_id=$1 AND principal_id=$2 AND capability='tasks.complete'",
            [req.actor.account_id, p.id],
          )
        ).rowCount
      )
        throw new Problem(
          400,
          "The recipient needs permission to complete assigned work.",
        );
      const h = (
        await c.query(
          "INSERT INTO handovers(account_id,task_id,from_id,to_id) VALUES($1,$2,$3,$4) RETURNING *",
          [req.actor.account_id, t.id, req.actor.id, p.id],
        )
      ).rows[0];
      await c.query(
        "UPDATE tasks SET version=version+1 WHERE account_id=$1 AND id=$2",
        [req.actor.account_id, t.id],
      );
      await audit(c, req.actor, "handover.offered", "task", t.id, { to: p.id });
      return h;
    }),
  );
});
work.post("/handovers/:id/decide", async (req, res) => {
  const b = parse(
    z.object({ decision: z.enum(["accepted", "declined"]) }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const initial = await owned(c, "handovers", req.actor, req.params.id);
      const t = await owned(c, "tasks", req.actor, initial.task_id, true);
      const h = await owned(c, "handovers", req.actor, req.params.id, true);
      if (h.to_id !== req.actor.id)
        throw new Problem(403, "Only the recipient can decide this handover.");
      if (
        h.state !== "pending" ||
        t.owner_id !== h.from_id ||
        ["completed", "cancelled"].includes(t.status)
      )
        throw new Problem(409, "This handover is no longer pending.");
      if (b.decision === "accepted") {
        requireCap(req.actor, "tasks.complete");
        await c.query(
          "UPDATE tasks SET owner_id=$1,version=version+1 WHERE account_id=$2 AND id=$3",
          [req.actor.id, req.actor.account_id, t.id],
        );
      }
      await c.query(
        "UPDATE handovers SET state=$1,decided_at=now() WHERE account_id=$2 AND id=$3",
        [b.decision, req.actor.account_id, h.id],
      );
      await audit(c, req.actor, "handover." + b.decision, "task", t.id);
      return { ok: true };
    }),
  );
});
work.post("/tasks/:id/reassign", async (req, res) => {
  requireCap(req.actor, "tasks.reassign");
  const b = parse(
    z.object({ toId: uuid, reason: text, version: ver }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const t = await owned(c, "tasks", req.actor, req.params.id, true);
      version(t, b.version);
      const p = await owned(c, "principals", req.actor, b.toId, true);
      if (p.status !== "active")
        throw new Problem(400, "Recipient is not active.");
      await c.query(
        "UPDATE tasks SET owner_id=$1,reason=$2,version=version+1 WHERE account_id=$3 AND id=$4",
        [p.id, "Reassigned: " + b.reason, req.actor.account_id, t.id],
      );
      await c.query(
        "UPDATE handovers SET state='cancelled',decided_at=now() WHERE account_id=$1 AND task_id=$2 AND state='pending'",
        [req.actor.account_id, t.id],
      );
      await audit(c, req.actor, "task.force_reassigned", "task", t.id, {
        from: t.owner_id,
        to: p.id,
        reason: b.reason,
      });
      return { ok: true };
    }),
  );
});
