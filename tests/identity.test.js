import "./safety.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
import { pool } from "../server/db.js";
import { migrate } from "../db/migrate.js";
const mailbox = [];
const app = createApp({
  deliverMail: async (message) => mailbox.push(message),
});
const call = (agent, path, body) =>
  agent
    .post("/api" + path)
    .set("Origin", process.env.APP_ORIGIN)
    .set("X-Ellis-Request", "1")
    .send(body);
const password = "Synthetic-test-password-192!";
async function identity(email, intent = "personal") {
  const agent = request.agent(app);
  assert.equal(
    (
      await call(agent, "/auth/register", {
        email,
        name: "Synthetic Veterinarian",
        password,
        intent,
      })
    ).status,
    202,
  );
  assert.equal((await agent.get("/api/workspaces")).status, 403);
  const token = new URL(mailbox.findLast((m) => m.to === email).url).hash.slice(
    7,
  );
  const verification = await call(agent, "/auth/verify", { token });
  assert.equal(verification.status, 200, JSON.stringify(verification.body));
  return agent;
}
const setup = (kind, slug) => ({
  kind,
  slug,
  name: kind === "clinic" ? "Synthetic clinic" : "",
  country: "NG",
  currency: "NGN",
  timezone: "Africa/Lagos",
  clinical: false,
  key: randomUUID(),
});
after(() => pool.end());
test("verified identity, isolated workspaces, conversion and recovery", async (t) => {
  await migrate();
  await migrate();
  const personal = await identity("vet@example.test");
  const body = setup("personal", "my-practice");
  let workspace;
  await t.test(
    "personal setup persists and idempotent retry returns same workspace",
    async () => {
      const created = await call(personal, "/workspaces", body);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      workspace = created.body.workspace;
      const repeated = await call(personal, "/workspaces", body);
      assert.equal(repeated.body.workspace.id, workspace.id);
      assert.equal((await personal.get("/api/me")).body.kind, "personal");
      assert.equal(
        (
          await call(personal, "/invitations", {
            email: "staff@example.test",
            capabilities: [],
          })
        ).status,
        403,
      );
    },
  );
  const admin = await identity("admin@example.test", "clinic");
  let patient;
  await t.test(
    "patient, unsigned note and unassigned work persist on Today",
    async () => {
      const created = await call(personal, "/patients", {
        name: "Synthetic Pip",
        species: "dog",
        clientName: "Synthetic Client",
      });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      patient = created.body;
      const visit = await call(personal, "/visits", { patientId: patient.id });
      assert.equal(visit.status, 201);
      assert.equal(visit.body.responsible_id, null);
      assert.ok(visit.body.created_by);
      const note = await call(personal, "/notes", {
        visitId: visit.body.id,
        content: "Synthetic observation for testing only.",
      });
      assert.equal(note.status, 201);
      assert.equal(note.body.state, "draft");
      const task = await call(personal, "/tasks", {
        patientId: patient.id,
        visitId: visit.body.id,
        kind: "follow_up",
        action: "Synthetic follow-up call",
      });
      assert.equal(task.status, 201);
      assert.equal(task.body.owner_id, null);
      assert.ok(task.body.created_by);
      const dashboard = await personal.get("/api/today");
      assert.equal(dashboard.status, 200);
      assert.equal(dashboard.body.visits[0].id, visit.body.id);
      assert.equal(dashboard.body.tasks[0].id, task.body.id);
      assert.equal(dashboard.body.tasks[0].owner_name, "Shared");
      assert.equal(dashboard.body.tasks[0].overdue, false);
      assert.equal((await personal.get("/api/tasks")).body.length, 1);
      const detail = await personal.get("/api/patients/" + patient.id);
      assert.equal(detail.body.notes[0].id, note.body.id);
      assert.equal(detail.body.visits[0].id, visit.body.id);
    },
  );
  await t.test(
    "appointments warn about overlaps and concurrent check-in creates one visit",
    async () => {
      const second = await call(personal, "/patients", {
        name: "Synthetic Mo",
        species: "cat",
        clientName: "Synthetic Schedule Client",
      });
      const command = {
        patientId: second.body.id,
        reason: "Synthetic scheduled visit",
        startsAt: "2026-11-02T09:00:00Z",
        endsAt: "2026-11-02T09:30:00Z",
        key: randomUUID(),
      };
      const appointment = await call(personal, "/appointments", command);
      assert.equal(appointment.status, 201, JSON.stringify(appointment.body));
      assert.equal(
        (await call(personal, "/appointments", command)).body.id,
        appointment.body.id,
      );
      const overlapping = await call(personal, "/appointments", {
        ...command,
        key: randomUUID(),
      });
      assert.equal(overlapping.status, 409);
      assert.equal(overlapping.body.code, "appointment_overlap");
      const beforePracticeWeek = await call(personal, "/appointments", {
        ...command,
        startsAt: "2026-11-01T22:30:00Z",
        endsAt: "2026-11-01T22:45:00Z",
        key: randomUUID(),
      });
      const inPracticeWeek = await call(personal, "/appointments", {
        ...command,
        startsAt: "2026-11-01T23:30:00Z",
        endsAt: "2026-11-02T00:00:00Z",
        key: randomUUID(),
      });
      const practiceWeek = await personal.get(
        "/api/appointments?weekStart=2026-11-02",
      );
      assert.equal(practiceWeek.status, 200, JSON.stringify(practiceWeek.body));
      assert.equal(
        practiceWeek.body.some((row) => row.id === inPracticeWeek.body.id),
        true,
        "Monday begins at midnight in the practice timezone",
      );
      assert.equal(
        practiceWeek.body.some((row) => row.id === beforePracticeWeek.body.id),
        false,
        "Sunday evening in the practice timezone belongs to the prior week",
      );
      const results = await Promise.all([
        call(
          personal,
          "/appointments/" + appointment.body.id + "/check-in",
          {},
        ),
        call(
          personal,
          "/appointments/" + appointment.body.id + "/check-in",
          {},
        ),
      ]);
      assert.ok(results.every((r) => r.status === 200));
      assert.equal(results[0].body.id, results[1].body.id);
      assert.equal(results[0].body.responsible_id, null);
      const count = await pool.query(
        "SELECT count(*)::int AS n FROM visits WHERE account_id=$1 AND appointment_id=$2",
        [workspace.id, appointment.body.id],
      );
      assert.equal(count.rows[0].n, 1);
    },
  );
  await t.test("solo nonclinical clinic and collision rollback", async () => {
    assert.equal(
      (await call(admin, "/workspaces", setup("clinic", "my-practice"))).status,
      409,
    );
    const created = await call(
      admin,
      "/workspaces",
      setup("clinic", "other-clinic"),
    );
    assert.equal(created.status, 201);
    const me = (await admin.get("/api/me")).body;
    assert.equal(me.capabilities.includes("notes.sign"), false);
    assert.equal((await admin.get("/api/patients/" + patient.id)).status, 404);
    assert.equal((await admin.get("/api/today")).body.visits.length, 0);
    assert.equal(
      (await call(admin, "/workspaces/select", { slug: "my-practice" })).status,
      403,
    );
  });
  await t.test(
    "conversion keeps IDs and old address; collision rolls back; retries do not duplicate audit",
    async () => {
      const me = (await personal.get("/api/me")).body;
      assert.equal(
        (
          await call(personal, "/workspace/convert", {
            name: "My clinic",
            slug: "other-clinic",
            version: me.account_version,
            confirmed: true,
          })
        ).status,
        409,
      );
      assert.equal((await personal.get("/api/me")).body.kind, "personal");
      const command = {
        name: "My clinic",
        slug: "my-new-clinic",
        version: me.account_version,
        confirmed: true,
      };
      const results = await Promise.all([
        call(personal, "/workspace/convert", command),
        call(personal, "/workspace/convert", command),
      ]);
      assert.ok(results.every((r) => r.status === 200));
      assert.ok(results.every((r) => r.body.id === workspace.id));
      assert.equal(
        (await personal.get("/api/patients/" + patient.id)).body.id,
        patient.id,
      );
      assert.equal(
        (await call(personal, "/workspaces/select", { slug: "my-practice" }))
          .status,
        200,
      );
      const events = await pool.query(
        "SELECT count(*)::int AS n FROM audit_events WHERE account_id=$1 AND action='workspace.converted'",
        [workspace.id],
      );
      assert.equal(events.rows[0].n, 1);
    },
  );
  await t.test(
    "invitation joins verified identity, retries safe, revoked member denied",
    async () => {
      assert.equal(
        (
          await call(personal, "/invitations", {
            email: "admin@example.test",
            capabilities: ["patients.view"],
          })
        ).status,
        201,
      );
      const token = new URL(mailbox.at(-1).url).hash.slice(7);
      assert.equal(
        (await call(admin, "/invitations/accept", { token })).status,
        200,
      );
      assert.equal(
        (await call(admin, "/invitations/accept", { token })).status,
        200,
      );
      assert.equal((await admin.get("/api/workspaces")).body.length, 2);
      assert.equal((await admin.get("/api/audit")).status, 403);
      await pool.query(
        "UPDATE principals SET status='disabled',auth_version=auth_version+1 WHERE account_id=$1 AND NOT is_owner",
        [workspace.id],
      );
      assert.equal((await admin.get("/api/me")).status, 403);
    },
  );
  await t.test(
    "logout/login preserves membership; reset invalidates existing sessions",
    async () => {
      await call(personal, "/auth/logout", {});
      assert.equal((await personal.get("/api/me")).status, 401);
      assert.equal(
        (
          await call(personal, "/auth/login", {
            email: "vet@example.test",
            password,
          })
        ).body.next,
        "/workspaces",
      );
      await call(personal, "/workspaces/select", { slug: "my-practice" });
      await call(personal, "/auth/forgot-password", {
        email: "vet@example.test",
      });
      const token = new URL(mailbox.at(-1).url).hash.slice(7);
      assert.equal(
        (
          await call(request.agent(app), "/auth/reset-password", {
            token,
            password: password + "2",
          })
        ).status,
        200,
      );
      assert.equal((await personal.get("/api/me")).status, 401);
    },
  );
});

test("public demo requests persist, reconcile retries and reject invalid submissions", async () => {
  await migrate();
  const visitor = request.agent(app);
  const details = {
    key: randomUUID(),
    name: "Synthetic Visitor",
    email: "demo@example.test",
    phone: "+234000000000",
    practiceName: "Synthetic Practice",
    practiceType: "personal",
    timezone: "Africa/Lagos",
    preferredTime: "Monday afternoon",
    details: "Patient workflow walkthrough",
    consent: true,
  };
  const first = await call(visitor, "/demo-requests", details);
  assert.equal(first.status, 201);
  const repeated = await call(visitor, "/demo-requests", details);
  assert.equal(repeated.body.id, first.body.id);
  const persisted = (
    await pool.query("SELECT * FROM demo_requests WHERE id=$1", [first.body.id])
  ).rows[0];
  assert.equal(persisted.email, details.email);
  assert.equal(persisted.details, details.details);
  assert.equal(
    (await call(visitor, "/demo-requests", { ...details, name: "Changed" }))
      .status,
    409,
  );
  assert.equal(
    (
      await call(visitor, "/demo-requests", {
        ...details,
        key: randomUUID(),
        consent: false,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(app).post("/api/demo-requests").send(details)).status,
    403,
  );
  assert.notEqual((await visitor.get("/api/demo-requests")).status, 200);
});

test("failed signup email can be resumed through login, resend, setup and dashboard", async () => {
  await migrate();
  const failed = request.agent(
    createApp({
      deliverMail: async () => {
        throw new Error("Provider unavailable");
      },
    }),
  );
  const email = "mail-retry@example.test";
  const registration = await call(failed, "/auth/register", {
    name: "Synthetic Retry",
    email,
    password,
    intent: "clinic",
  });
  assert.equal(registration.status, 503);
  assert.equal(registration.body.code, "mail_failed");
  const recovered = request.agent(app);
  assert.equal(
    (await call(recovered, "/auth/login", { email, password })).body.next,
    "/verify-email",
  );
  assert.equal((await call(recovered, "/auth/resend", {})).status, 200);
  const token = new URL(mailbox.findLast((m) => m.to === email).url).hash.slice(
    7,
  );
  assert.equal(
    (await call(recovered, "/auth/verify", { token })).body.next,
    "/onboarding/clinic",
  );
  assert.equal(
    (await call(recovered, "/workspaces", setup("clinic", "mail-retry-clinic")))
      .body.next,
    "/app/today",
  );
  assert.equal((await recovered.get("/api/today")).status, 200);
  await call(recovered, "/auth/logout", {});
  assert.equal(
    (await call(recovered, "/auth/login", { email, password })).body.next,
    "/workspaces",
  );
  assert.equal(
    (await call(recovered, "/workspaces/select", { slug: "mail-retry-clinic" }))
      .body.next,
    "/app/today",
  );
  assert.equal((await recovered.get("/api/today")).status, 200);
});
