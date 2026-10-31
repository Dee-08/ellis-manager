import { Router } from "express";
import { pool, tx, audit } from "./db.js";
import { z, parse, uuid, text, ver } from "./validation.js";
import { Problem, requireCap, version } from "./domain.js";
import { owned } from "./records.js";
export const schedule = Router();
const timing = {
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
};
async function validateSlot(c, actor, b, except = null) {
  if (new Date(b.endsAt) <= new Date(b.startsAt))
    throw new Problem(400, "End time must be after start time.");
  const conflicts = await c.query(
    "SELECT 1 FROM appointments WHERE account_id=$1 AND state IN ('booked','confirmed') AND starts_at<$3 AND ends_at>$2 AND ($4::uuid IS NULL OR clinician_id=$4) AND ($5::uuid IS NULL OR id<>$5) LIMIT 1",
    [actor.account_id, b.startsAt, b.endsAt, b.clinicianId || null, except],
  );
  if (conflicts.rowCount && !b.overrideOverlap)
    throw new Problem(
      409,
      "Another appointment overlaps this time. Review the schedule and explicitly allow overlap if needed.",
      "appointment_overlap",
    );
  if (b.clinicianId) {
    const person = await owned(c, "principals", actor, b.clinicianId);
    const cap = await c.query(
      "SELECT 1 FROM capability_grants WHERE account_id=$1 AND principal_id=$2 AND capability='visits.manage'",
      [actor.account_id, person.id],
    );
    if (person.status !== "active" || !cap.rowCount)
      throw new Problem(
        400,
        "Choose an active member with clinical visit capabilities.",
      );
  }
}
schedule.get("/appointments", async (req, res) => {
  requireCap(req.actor, "appointment.view");
  const q = z
    .object({
      weekStart: z.iso.date(),
    })
    .parse(req.query);
  res.json(
    (
      await pool.query(
        "SELECT a.*,p.name AS patient_name FROM appointments a JOIN patients p ON p.account_id=a.account_id AND p.id=a.patient_id WHERE a.account_id=$1 AND a.starts_at < (($2::date + 7)::timestamp AT TIME ZONE $3) AND a.ends_at > ($2::date::timestamp AT TIME ZONE $3) ORDER BY a.starts_at,a.id LIMIT 500",
        [req.actor.account_id, q.weekStart, req.actor.timezone],
      )
    ).rows,
  );
});
schedule.post("/appointments", async (req, res) => {
  requireCap(req.actor, "appointment.manage");
  const b = parse(
    z.object({
      patientId: uuid,
      reason: text,
      ...timing,
      clinicianId: uuid.optional(),
      internalNote: z.string().max(2000).default(""),
      overrideOverlap: z.boolean().default(false),
      key: uuid,
    }),
    req.body,
  );
  res.status(201).json(
    await tx(async (c) => {
      const existing = (
        await c.query(
          "SELECT * FROM appointments WHERE account_id=$1 AND command_key=$2",
          [req.actor.account_id, b.key],
        )
      ).rows[0];
      if (existing) {
        if (
          existing.patient_id !== b.patientId ||
          existing.reason !== b.reason ||
          new Date(existing.starts_at).toISOString() !==
            new Date(b.startsAt).toISOString() ||
          new Date(existing.ends_at).toISOString() !==
            new Date(b.endsAt).toISOString() ||
          existing.internal_note !== b.internalNote ||
          (existing.clinician_id || null) !== (b.clinicianId || null)
        )
          throw new Problem(
            409,
            "This submission key was used with different details.",
          );
        return existing;
      }
      await owned(c, "patients", req.actor, b.patientId);
      await validateSlot(c, req.actor, b);
      const a = (
        await c.query(
          "INSERT INTO appointments(account_id,patient_id,clinician_id,created_by,reason,internal_note,starts_at,ends_at,command_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            req.actor.account_id,
            b.patientId,
            b.clinicianId || null,
            req.actor.id,
            b.reason,
            b.internalNote,
            b.startsAt,
            b.endsAt,
            b.key,
          ],
        )
      ).rows[0];
      await audit(c, req.actor, "appointment.created", "appointment", a.id, {
        overlapOverride: b.overrideOverlap,
      });
      return a;
    }),
  );
});
schedule.post("/appointments/:id/check-in", async (req, res) => {
  requireCap(req.actor, "appointment.manage");
  uuid.parse(req.params.id);
  res.json(
    await tx(async (c) => {
      const a = (
        await c.query(
          "SELECT * FROM appointments WHERE account_id=$1 AND id=$2 FOR UPDATE",
          [req.actor.account_id, req.params.id],
        )
      ).rows[0];
      if (!a) throw new Problem(404, "Appointment not found.");
      const prior = (
        await c.query(
          "SELECT * FROM visits WHERE account_id=$1 AND appointment_id=$2",
          [req.actor.account_id, a.id],
        )
      ).rows[0];
      if (prior) return prior;
      if (!["booked", "confirmed"].includes(a.state))
        throw new Problem(409, "This appointment cannot be checked in.");
      const active = await c.query(
        "SELECT id FROM visits WHERE account_id=$1 AND patient_id=$2 AND state IN ('waiting','in_consultation')",
        [req.actor.account_id, a.patient_id],
      );
      if (active.rowCount)
        throw new Problem(
          409,
          "This patient already has an active visit. Open the existing patient record.",
          "active_visit",
        );
      const visit = (
        await c.query(
          "INSERT INTO visits(account_id,patient_id,responsible_id,created_by,appointment_id) VALUES($1,$2,$3,$4,$5) RETURNING *",
          [
            req.actor.account_id,
            a.patient_id,
            a.clinician_id,
            req.actor.id,
            a.id,
          ],
        )
      ).rows[0];
      await c.query(
        "UPDATE appointments SET state='arrived',version=version+1 WHERE id=$1 AND account_id=$2",
        [a.id, req.actor.account_id],
      );
      await audit(c, req.actor, "appointment.arrived", "appointment", a.id, {
        visitId: visit.id,
      });
      return visit;
    }),
  );
});
schedule.patch("/appointments/:id", async (req, res) => {
  requireCap(req.actor, "appointment.manage");
  uuid.parse(req.params.id);
  const b = parse(
    z.object({
      ...timing,
      version: ver,
      state: z.enum(["booked", "confirmed", "cancelled", "no_show"]),
      reason: text,
      overrideOverlap: z.boolean().default(false),
    }),
    req.body,
  );
  res.json(
    await tx(async (c) => {
      const a = (
        await c.query(
          "SELECT * FROM appointments WHERE account_id=$1 AND id=$2 FOR UPDATE",
          [req.actor.account_id, req.params.id],
        )
      ).rows[0];
      if (!a) throw new Problem(404, "Appointment not found.");
      version(a, b.version);
      if (a.state === "arrived")
        throw new Problem(
          409,
          "An arrived appointment must be corrected through its visit.",
        );
      if (["booked", "confirmed"].includes(b.state))
        await validateSlot(
          c,
          req.actor,
          { ...b, clinicianId: a.clinician_id },
          a.id,
        );
      const updated = (
        await c.query(
          "UPDATE appointments SET starts_at=$1,ends_at=$2,state=$3,version=version+1 WHERE account_id=$4 AND id=$5 RETURNING *",
          [b.startsAt, b.endsAt, b.state, req.actor.account_id, a.id],
        )
      ).rows[0];
      await audit(c, req.actor, "appointment.changed", "appointment", a.id, {
        previousStart: a.starts_at,
        previousEnd: a.ends_at,
        previousState: a.state,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        state: b.state,
        reason: b.reason,
      });
      return updated;
    }),
  );
});
