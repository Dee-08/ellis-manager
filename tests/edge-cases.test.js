import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
import { pool } from "../server/db.js";
import { migrate } from "../db/migrate.js";
const app = createApp(),
  origin = process.env.APP_ORIGIN,
  pass = "Synthetic-Long-Password-42",
  slug = "edge-" + randomUUID().slice(0, 8);
const call = (a, m, p, b) =>
  b === undefined
    ? a[m]("/api" + p)
    : a[m]("/api" + p)
        .set("Origin", origin)
        .set("X-Ellis-Request", "1")
        .send(b);
after(() => pool.end());
test("activation, export, account boundaries and failed writes", async (t) => {
  await migrate();
  const owner = request.agent(app),
    staff = request.agent(app);
  await call(owner, "post", "/auth/register", {
    kind: "clinic",
    practiceName: "Synthetic Edge Clinic",
    slug,
    name: "Owner",
    email: "owner@example.test",
    password: pass,
    timezone: "America/New_York",
    clinical: "on",
  });
  const me = (await call(owner, "get", "/me")).body;
  await t.test(
    "task edits enforce versions and closed-state protection",
    async () => {
      const task = (
        await call(owner, "post", "/tasks", {
          action: "Synthetic edit test",
          kind: "task",
        })
      ).body;
      const edit = {
        action: "Updated action",
        dueAt: "2026-12-01T09:00:00Z",
        version: task.version,
      };
      const updated = await call(owner, "patch", `/tasks/${task.id}`, edit);
      assert.equal(updated.status, 200);
      assert.equal(updated.body.action, edit.action);
      assert.equal(
        (await call(owner, "patch", `/tasks/${task.id}`, edit)).status,
        409,
      );
      const closed = await call(owner, "post", `/tasks/${task.id}/state`, {
        status: "completed",
        version: updated.body.version,
      });
      assert.equal(closed.status, 200);
      assert.equal(
        (
          await call(owner, "patch", `/tasks/${task.id}`, {
            ...edit,
            version: closed.body.version,
          })
        ).status,
        409,
      );
    },
  );
  await t.test("duplicate registration rolls back atomically", async () => {
    const before = (
      await pool.query("SELECT count(*) FROM principals WHERE account_id=$1", [
        me.account_id,
      ])
    ).rows[0].count;
    const r = await call(owner, "post", "/auth/register", {
      kind: "clinic",
      practiceName: "Duplicate",
      slug,
      name: "Owner",
      email: "owner@example.test",
      password: pass,
      timezone: "Africa/Lagos",
    });
    assert.equal(r.status, 409);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*) FROM principals WHERE account_id=$1",
          [me.account_id],
        )
      ).rows[0].count,
      before,
    );
  });
  await t.test(
    "expired and rotated activation tokens cannot be consumed",
    async () => {
      const r = await call(owner, "post", "/team", {
        name: "Staff",
        email: "s@example.test",
        capabilities: ["tasks.complete"],
      });
      const token = new URL(r.body.activationLink).hash.split("=")[1];
      await pool.query(
        "UPDATE activation_tokens SET expires_at=now()-interval '1 second' WHERE principal_id=$1",
        [r.body.id],
      );
      assert.equal(
        (await call(staff, "post", "/auth/activate", { token, password: pass }))
          .status,
        400,
      );
      const rotated = await call(
        owner,
        "post",
        "/team/" + r.body.id + "/rotate",
        {},
      );
      const fresh = new URL(rotated.body.activationLink).hash.split("=")[1];
      assert.equal(
        (await call(staff, "post", "/auth/activation-info", { token: fresh }))
          .body.clinic,
        "Synthetic Edge Clinic",
      );
      assert.equal(
        (await call(staff, "post", "/auth/activate", { token, password: pass }))
          .status,
        400,
      );
      const responses = await Promise.all([
        call(staff, "post", "/auth/activate", { token: fresh, password: pass }),
        call(request.agent(app), "post", "/auth/activate", {
          token: fresh,
          password: pass,
        }),
      ]);
      assert.deepEqual(responses.map((x) => x.status).sort(), [200, 400]);
    },
  );
  await t.test(
    "staff cannot manufacture permissions or export patient data",
    async () => {
      await call(staff, "post", "/auth/login", {
        slug,
        email: "s@example.test",
        password: pass,
      });
      assert.equal((await call(staff, "get", "/patients")).status, 403);
      assert.equal(
        (await call(staff, "get", "/export?type=patients")).status,
        403,
      );
      assert.equal(
        (
          await call(staff, "post", "/team", {
            name: "Fake",
            email: "f@example.test",
            capabilities: ["staff.manage"],
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "exports remain account scoped and protected from cache",
    async () => {
      const r = await call(owner, "get", "/export?type=patients");
      assert.equal(r.status, 200);
      assert.equal(r.headers["cache-control"], "no-store");
      assert.equal(r.body.records.length, 0);
    },
  );
  await t.test(
    "two simultaneous starts cannot create duplicate active visits",
    async () => {
      const patient = (
        await call(owner, "post", "/patients", {
          name: "Test Dog",
          species: "Dog",
          clientName: "Test Client",
        })
      ).body;
      const r = await Promise.all([
        call(owner, "post", "/visits", { patientId: patient.id }),
        call(owner, "post", "/visits", { patientId: patient.id }),
      ]);
      assert.deepEqual(r.map((x) => x.status).sort(), [201, 409]);
    },
  );
  await t.test("SQL parameters treat malicious search as text", async () => {
    const r = await call(
      owner,
      "get",
      "/patients?q=" + encodeURIComponent("%' OR 1=1; --"),
    );
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });
  await t.test(
    "database failure within transaction leaves no partial clinical/audit write",
    async () => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        await c.query("INSERT INTO clients(account_id,name) VALUES($1,$2)", [
          me.account_id,
          "Should roll back",
        ]);
        await assert.rejects(
          c.query(
            "INSERT INTO patients(account_id,client_id,name,species) VALUES($1,$2,$3,$4)",
            [me.account_id, randomUUID(), "Broken", "Dog"],
          ),
        );
        await c.query("ROLLBACK");
        assert.equal(
          (
            await c.query(
              "SELECT 1 FROM clients WHERE account_id=$1 AND name=$2",
              [me.account_id, "Should roll back"],
            )
          ).rowCount,
          0,
        );
      } finally {
        c.release();
      }
    },
  );
  await t.test(
    "timezone conversion crosses midnight and daylight saving correctly",
    async () => {
      const r = await pool.query(
        "SELECT ('2026-11-01T05:30:00Z'::timestamptz AT TIME ZONE 'America/New_York')::text AS first,('2026-11-01T06:30:00Z'::timestamptz AT TIME ZONE 'America/New_York')::text AS second,('2026-10-22T23:30:00Z'::timestamptz AT TIME ZONE 'Africa/Lagos')::date::text AS local_date",
      );
      assert.equal(r.rows[0].first, r.rows[0].second);
      assert.equal(r.rows[0].local_date, "2026-10-23");
    },
  );
});
