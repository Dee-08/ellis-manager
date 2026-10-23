import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
import { pool } from "../server/db.js";
import { migrate } from "../db/migrate.js";
import { taskTransition, visitTransition } from "../server/domain.js";
const app = createApp(),
  origin = process.env.APP_ORIGIN,
  pass = "Synthetic-test-only-719!",
  suffix = randomUUID().slice(0, 8);
const call = (agent, method, path, body) => {
  const r = agent[method]("/api" + path);
  return body === undefined
    ? r
    : r.set("Origin", origin).set("X-Ellis-Request", "1").send(body);
};
const register = (agent, kind, slug, clinical = true) =>
  call(agent, "post", "/auth/register", {
    kind,
    slug,
    practiceName: "Synthetic " + kind,
    name: "Test Owner",
    email: "owner@example.test",
    password: pass,
    timezone: "Africa/Lagos",
    ...(clinical ? { clinical: "on" } : {}),
  });
after(() => pool.end());
test("PostgreSQL journeys, isolation, concurrency, notes, staff and ownership", async (t) => {
  await migrate();
  const personal = request.agent(app),
    clinic = request.agent(app),
    other = request.agent(app),
    staff = request.agent(app);
  let p, visit, note, task, staffId, me, cm, activationToken;
  await t.test(
    "independent personal and solo clinic use the same email",
    async () => {
      assert.equal(
        (await register(personal, "personal", "personal-" + suffix)).status,
        201,
      );
      assert.equal(
        (await register(clinic, "clinic", "clinic-" + suffix)).status,
        201,
      );
      assert.equal(
        (await register(other, "clinic", "other-" + suffix, false)).status,
        201,
      );
      me = (await call(personal, "get", "/me")).body;
      cm = (await call(clinic, "get", "/me")).body;
      assert.notEqual(me.account_id, cm.account_id);
      assert.equal(me.email, cm.email);
      assert.equal(
        (await call(other, "get", "/me")).body.capabilities.includes(
          "notes.sign",
        ),
        false,
      );
      assert.equal((await call(personal, "get", "/team")).status, 403);
    },
  );
  await t.test(
    "CSRF and submitted account/capability fields rejected",
    async () => {
      assert.equal(
        (await clinic.post("/api/tasks").send({ action: "x" })).status,
        403,
      );
      assert.equal(
        (
          await call(clinic, "post", "/patients", {
            name: "Milo",
            species: "Dog",
            clientName: "Synthetic Owner",
            account_id: me.account_id,
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "create client/patient and persist through a new app/session",
    async () => {
      const r = await call(clinic, "post", "/patients", {
        name: "Milo",
        species: "Dog",
        clientName: "Synthetic Owner",
        age: "Unknown",
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      p = r.body;
      assert.equal(
        (await call(clinic, "get", "/patients/" + p.id)).body.client.name,
        "Synthetic Owner",
      );
      const fresh = request.agent(createApp());
      assert.equal(
        (
          await call(fresh, "post", "/auth/login", {
            slug: cm.slug,
            email: cm.email,
            password: pass,
          })
        ).status,
        200,
      );
      assert.equal(
        (await call(fresh, "get", "/patients/" + p.id)).body.name,
        "Milo",
      );
    },
  );
  await t.test("cross-account records and foreign keys denied", async () => {
    assert.equal(
      (await call(personal, "get", "/patients/" + p.id)).status,
      404,
    );
    assert.equal(
      (await call(personal, "post", "/visits", { patientId: p.id })).status,
      404,
    );
    await assert.rejects(
      pool.query(
        "INSERT INTO patients(account_id,client_id,name,species) VALUES($1,$2,$3,$4)",
        [me.account_id, p.client_id, "Attack", "Dog"],
      ),
      (e) => e.code === "23503",
    );
  });
  await t.test("stale patient edit conflicts", async () => {
    const b = { name: "Milo", species: "Dog", version: 1 };
    assert.equal(
      (await call(clinic, "patch", "/patients/" + p.id, b)).status,
      200,
    );
    assert.equal(
      (
        await call(clinic, "patch", "/patients/" + p.id, {
          ...b,
          name: "Lost update",
        })
      ).status,
      409,
    );
  });
  await t.test(
    "solo visit, signed note and append-only amendment",
    async () => {
      visit = (await call(clinic, "post", "/visits", { patientId: p.id })).body;
      let r = await call(clinic, "post", "/notes", {
        visitId: visit.id,
        content: "Synthetic coordination note; primary record elsewhere.",
      });
      assert.equal(r.status, 201);
      note = r.body;
      assert.equal(
        (
          await call(clinic, "post", "/notes/" + note.id + "/sign", {
            version: 1,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call(clinic, "patch", "/notes/" + note.id, {
            content: "overwrite",
            version: 2,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(clinic, "post", "/notes", {
            visitId: visit.id,
            content: "Synthetic correction",
            amendsId: note.id,
            reason: "Correction",
          })
        ).status,
        201,
      );
    },
  );
  await t.test(
    "visit ending preserves follow-up and contact attempts do not complete it",
    async () => {
      let r = await call(clinic, "post", "/tasks", {
        action: "Synthetic recovery call",
        kind: "follow_up",
        patientId: p.id,
        visitId: visit.id,
        dueAt: "2020-01-01T12:00:00Z",
      });
      assert.equal(r.status, 201);
      task = r.body;
      assert.equal(
        (
          await call(clinic, "post", "/visits/" + visit.id + "/state", {
            state: "ended",
            version: 1,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call(clinic, "post", "/tasks/" + task.id + "/contact", {
            channel: "phone",
            outcome: "No answer",
            version: 1,
          })
        ).status,
        201,
      );
      assert.equal(
        (await call(clinic, "get", "/tasks/" + task.id)).body.status,
        "open",
      );
      assert.equal(
        (await call(clinic, "get", "/tasks")).body.find((x) => x.id === task.id)
          .overdue,
        true,
      );
    },
  );
  await t.test(
    "concurrent task completion admits exactly one update",
    async () => {
      const responses = await Promise.all([
        call(clinic, "post", "/tasks/" + task.id + "/state", {
          status: "completed",
          version: 2,
        }),
        call(clinic, "post", "/tasks/" + task.id + "/state", {
          status: "completed",
          version: 2,
        }),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
      assert.equal(
        (
          await call(clinic, "post", "/tasks/" + task.id + "/state", {
            status: "open",
            version: 3,
            reason: "More work required",
          })
        ).status,
        200,
      );
    },
  );
  await t.test(
    "staff with no title, single-use activation and direct note denial",
    async () => {
      const r = await call(clinic, "post", "/team", {
        name: "Synthetic Staff",
        email: "staff@example.test",
        capabilities: ["patients.view", "tasks.complete", "tasks.create"],
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(r.body.delivered, false);
      staffId = r.body.id;
      activationToken = new URL(r.body.activationLink).hash.split("=")[1];
      assert.equal(
        (
          await call(staff, "post", "/auth/activate", {
            token: activationToken,
            password: pass,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call(request.agent(app), "post", "/auth/activate", {
            token: activationToken,
            password: pass,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(staff, "post", "/notes/" + note.id + "/sign", {
            version: 2,
          })
        ).status,
        403,
      );
      assert.equal(
        (await call(staff, "get", "/patients/" + p.id)).body.notes.length,
        0,
      );
      assert.equal((await call(staff, "get", "/audit")).status, 403);
    },
  );
  await t.test("handover keeps original owner until acceptance", async () => {
    const r = await call(clinic, "post", "/tasks/" + task.id + "/handover", {
      toId: staffId,
      version: 4,
    });
    assert.equal(r.status, 201);
    assert.equal(
      (await call(clinic, "get", "/tasks/" + task.id)).body.owner_id,
      cm.id,
    );
    assert.equal(
      (
        await call(staff, "post", "/handovers/" + r.body.id + "/decide", {
          decision: "accepted",
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(staff, "get", "/tasks/" + task.id)).body.owner_id,
      staffId,
    );
    assert.equal(
      (
        await call(staff, "post", "/handovers/" + r.body.id + "/decide", {
          decision: "accepted",
        })
      ).status,
      409,
    );
  });
  await t.test(
    "revocation immediately blocks session/token and escalates work",
    async () => {
      const list = (await call(clinic, "get", "/team")).body;
      const s = list.find((x) => x.id === staffId);
      assert.equal(s.title, "");
      assert.equal(
        (
          await call(clinic, "post", "/team/" + staffId + "/disable", {
            reason: "Test revocation",
            reviewed: true,
            version: s.auth_version,
          })
        ).status,
        200,
      );
      assert.equal((await call(staff, "get", "/me")).status, 401);
      assert.equal(
        (
          await call(request.agent(app), "post", "/auth/activate", {
            token: activationToken,
            password: pass,
          })
        ).status,
        400,
      );
      assert.equal(
        (await call(clinic, "get", "/tasks/" + task.id)).body.owner_id,
        cm.id,
      );
      assert.ok(
        (await call(clinic, "get", "/audit")).body.some(
          (x) => x.action === "staff.disabled",
        ),
      );
    },
  );
  await t.test(
    "owner safeguards and transfer preserve clinical separation",
    async () => {
      const r = await call(clinic, "post", "/team", {
        name: "Next Owner",
        email: "next@example.test",
        capabilities: [],
      });
      const next = request.agent(app);
      await call(next, "post", "/auth/activate", {
        token: new URL(r.body.activationLink).hash.split("=")[1],
        password: pass,
      });
      assert.equal(
        (
          await call(clinic, "post", "/team/" + cm.id + "/disable", {
            reason: "bad",
            reviewed: true,
            version: cm.auth_version,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(clinic, "post", "/ownership/transfer", {
            toId: r.body.id,
            confirmation: cm.slug,
          })
        ).status,
        200,
      );
      assert.equal((await call(clinic, "get", "/me")).status, 401);
      assert.equal((await call(next, "get", "/me")).status, 401);
      await call(next, "post", "/auth/login", {
        slug: cm.slug,
        email: "next@example.test",
        password: pass,
      });
      const n = (await call(next, "get", "/me")).body;
      assert.equal(n.is_owner, true);
      assert.equal(n.capabilities.includes("notes.sign"), false);
    },
  );
  await t.test("logout invalidates session", async () => {
    assert.equal(
      (await call(personal, "post", "/auth/logout", {})).status,
      200,
    );
    assert.equal((await call(personal, "get", "/me")).status, 401);
  });
});
test("invalid transitions and reasons rejected", () => {
  assert.throws(() => taskTransition("blocked", "completed", ""), /transition/);
  assert.throws(() => taskTransition("completed", "open", ""), /reason/);
  assert.throws(
    () => visitTransition("ended", "in_consultation", ""),
    /reason/,
  );
  taskTransition("open", "completed", "");
});
