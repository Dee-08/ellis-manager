import { Router } from "express";
import { pool, tx, audit } from "./db.js";
import { Problem, requireCap, version, visitTransition } from "./domain.js";
import { z, parse, text, optional, uuid, ver, page } from "./validation.js";
export const records = Router();
export async function owned(c, table, actor, id, lock = false) {
  const allowed = [
    "patients",
    "clients",
    "visits",
    "notes",
    "tasks",
    "principals",
    "handovers",
  ];
  if (!allowed.includes(table)) throw new Error("Invalid table");
  uuid.parse(id);
  const row = (
    await c.query(
      `SELECT * FROM ${table} WHERE account_id=$1 AND id=$2${lock ? " FOR UPDATE" : ""}`,
      [actor.account_id, id],
    )
  ).rows[0];
  if (!row) throw new Problem(404, "Record not found.");
  return row;
}
records.get("/patients", async (req, res) => {
  requireCap(req.actor, "patients.view");
  const { q, offset } = page(req.query);
  res.json(
    (
      await pool.query(
        "SELECT p.*,c.name AS client_name FROM patients p JOIN clients c ON c.account_id=p.account_id AND c.id=p.client_id WHERE p.account_id=$1 AND (p.name ILIKE $2 OR c.name ILIKE $2) ORDER BY p.name,p.id LIMIT 50 OFFSET $3",
        [req.actor.account_id, "%" + q + "%", offset],
      )
    ).rows,
  );
});
const patientFields = {
  name: text,
  species: text,
  breed: optional,
  sex: z.enum(["unknown", "female", "male"]).default("unknown"),
  age: optional,
};
records.post("/patients", async (req, res) => {
  requireCap(req.actor, "patients.edit");
  const b = parse(
    z.object({
      ...patientFields,
      clientId: uuid.optional(),
      clientName: text.optional(),
      phone: optional,
      email: z.union([z.email(), z.literal("")]).default(""),
    }),
    req.body,
  );
  if (!b.clientId && !b.clientName)
    throw new Problem(400, "Choose or name the animal owner.");
  const p = await tx(async (c) => {
    let clientId = b.clientId;
    if (clientId) await owned(c, "clients", req.actor, clientId);
    else
      clientId = (
        await c.query(
          "INSERT INTO clients(account_id,name,phone,email) VALUES($1,$2,$3,$4) RETURNING id",
          [req.actor.account_id, b.clientName, b.phone, b.email],
        )
      ).rows[0].id;
    const patient = (
      await c.query(
        "INSERT INTO patients(account_id,client_id,name,species,breed,sex,age) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [
          req.actor.account_id,
          clientId,
          b.name,
          b.species,
          b.breed,
          b.sex,
          b.age,
        ],
      )
    ).rows[0];
    await audit(c, req.actor, "patient.created", "patient", patient.id);
    return patient;
  });
  res.status(201).json(p);
});
records.get("/clients", async (req, res) => {
  requireCap(req.actor, "patients.view");
  const { q, offset } = page(req.query);
  res.json(
    (
      await pool.query(
        "SELECT * FROM clients WHERE account_id=$1 AND name ILIKE $2 ORDER BY name,id LIMIT 50 OFFSET $3",
        [req.actor.account_id, "%" + q + "%", offset],
      )
    ).rows,
  );
});
records.patch("/clients/:id", async (req, res) => {
  requireCap(req.actor, "patients.edit");
  const b = parse(
    z.object({
      name: text,
      phone: optional,
      email: z.union([z.email(), z.literal("")]),
      version: ver,
    }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const p = await owned(c, "clients", req.actor, req.params.id, true);
      version(p, b.version);
      const r = (
        await c.query(
          "UPDATE clients SET name=$1,phone=$2,email=$3,version=version+1 WHERE account_id=$4 AND id=$5 RETURNING *",
          [b.name, b.phone, b.email, req.actor.account_id, p.id],
        )
      ).rows[0];
      await audit(c, req.actor, "client.updated", "client", p.id);
      return r;
    }),
  );
});
records.patch("/patients/:id", async (req, res) => {
  requireCap(req.actor, "patients.edit");
  const b = parse(z.object({ ...patientFields, version: ver }), req.body);
  res.json(
    await tx(async (c) => {
      const p = await owned(c, "patients", req.actor, req.params.id, true);
      version(p, b.version);
      const r = (
        await c.query(
          "UPDATE patients SET name=$1,species=$2,breed=$3,sex=$4,age=$5,version=version+1 WHERE account_id=$6 AND id=$7 RETURNING *",
          [
            b.name,
            b.species,
            b.breed,
            b.sex,
            b.age,
            req.actor.account_id,
            p.id,
          ],
        )
      ).rows[0];
      await audit(c, req.actor, "patient.updated", "patient", p.id);
      return r;
    }),
  );
});
records.get("/patients/:id", async (req, res) => {
  requireCap(req.actor, "patients.view");
  const p = await owned(pool, "patients", req.actor, req.params.id);
  const client = await owned(pool, "clients", req.actor, p.client_id);
  const visits = (
    await pool.query(
      "SELECT v.*,p.name AS responsible_name FROM visits v LEFT JOIN principals p ON p.account_id=v.account_id AND p.id=v.responsible_id WHERE v.account_id=$1 AND patient_id=$2 ORDER BY arrived_at DESC LIMIT 100",
      [req.actor.account_id, p.id],
    )
  ).rows;
  const notes = req.actor.capabilities.includes("notes.view")
    ? (
        await pool.query(
          "SELECT n.*,p.name AS author_name FROM notes n JOIN visits v ON v.account_id=n.account_id AND v.id=n.visit_id JOIN principals p ON p.account_id=n.account_id AND p.id=n.author_id WHERE n.account_id=$1 AND v.patient_id=$2 ORDER BY n.created_at DESC LIMIT 100",
          [req.actor.account_id, p.id],
        )
      ).rows
    : [];
  res.json({ ...p, client, visits, notes });
});
records.post("/visits", async (req, res) => {
  requireCap(req.actor, "visits.manage");
  const b = parse(z.object({ patientId: uuid }), req.body);
  res.status(201).json(
    await tx(async (c) => {
      await owned(c, "patients", req.actor, b.patientId);
      const r = (
        await c.query(
          "INSERT INTO visits(account_id,patient_id,created_by) VALUES($1,$2,$3) RETURNING *",
          [req.actor.account_id, b.patientId, req.actor.id],
        )
      ).rows[0];
      await audit(c, req.actor, "visit.started", "visit", r.id);
      return r;
    }),
  );
});
records.post("/visits/:id/state", async (req, res) => {
  requireCap(req.actor, "visits.manage");
  const b = parse(
    z.object({
      state: z.enum(["waiting", "in_consultation", "ended", "cancelled"]),
      reason: optional,
      version: ver,
    }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const v = await owned(c, "visits", req.actor, req.params.id, true);
      version(v, b.version);
      visitTransition(v.state, b.state, b.reason);
      const r = (
        await c.query(
          "UPDATE visits SET state=$1,ended_at=CASE WHEN $1='ended' THEN now() ELSE NULL END,version=version+1 WHERE account_id=$2 AND id=$3 RETURNING *",
          [b.state, req.actor.account_id, v.id],
        )
      ).rows[0];
      await audit(c, req.actor, "visit." + b.state, "visit", v.id, {
        reason: b.reason,
      });
      return r;
    }),
  );
});
records.post("/notes", async (req, res) => {
  requireCap(req.actor, "notes.draft");
  const b = parse(
    z.object({
      visitId: uuid,
      content: z.string().trim().min(1).max(12000),
      amendsId: uuid.optional(),
      reason: optional,
    }),
    req.body,
  );
  res.status(201).json(
    await tx(async (c) => {
      await owned(c, "visits", req.actor, b.visitId);
      if (b.amendsId) {
        requireCap(req.actor, "notes.sign");
        const n = await owned(c, "notes", req.actor, b.amendsId);
        if (n.state !== "signed" || n.visit_id !== b.visitId || !b.reason)
          throw new Problem(
            400,
            "Amendments require a signed note in this visit and a reason.",
          );
      }
      const n = (
        await c.query(
          "INSERT INTO notes(account_id,visit_id,author_id,content,amends_id,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            req.actor.account_id,
            b.visitId,
            req.actor.id,
            b.content,
            b.amendsId || null,
            b.reason,
          ],
        )
      ).rows[0];
      await audit(c, req.actor, "note.drafted", "note", n.id, {
        amendment: !!b.amendsId,
      });
      return n;
    }),
  );
});
records.patch("/notes/:id", async (req, res) => {
  requireCap(req.actor, "notes.draft");
  const b = parse(
    z.object({ content: z.string().trim().min(1).max(12000), version: ver }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const n = await owned(c, "notes", req.actor, req.params.id, true);
      version(n, b.version);
      if (n.author_id !== req.actor.id)
        throw new Problem(403, "Only the author can edit this draft.");
      if (n.state !== "draft")
        throw new Problem(409, "Signed notes require an amendment.");
      const r = (
        await c.query(
          "UPDATE notes SET content=$1,version=version+1 WHERE account_id=$2 AND id=$3 RETURNING *",
          [b.content, req.actor.account_id, n.id],
        )
      ).rows[0];
      await audit(c, req.actor, "note.updated", "note", n.id);
      return r;
    }),
  );
});
records.post("/notes/:id/sign", async (req, res) => {
  requireCap(req.actor, "notes.sign");
  const b = parse(z.object({ version: ver }), req.body);
  res.json(
    await tx(async (c) => {
      const n = await owned(c, "notes", req.actor, req.params.id, true);
      version(n, b.version);
      if (n.author_id !== req.actor.id)
        throw new Problem(403, "Only the author can sign this note.");
      if (n.state !== "draft")
        throw new Problem(409, "This note is already signed.");
      const r = (
        await c.query(
          "UPDATE notes SET state='signed',signed_at=now(),version=version+1 WHERE account_id=$1 AND id=$2 RETURNING *",
          [req.actor.account_id, n.id],
        )
      ).rows[0];
      await audit(c, req.actor, "note.signed", "note", n.id);
      return r;
    }),
  );
});
