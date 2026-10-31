import "./safety.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "../server/db.js";
import { migrate } from "../db/migrate.js";
import { call, practice, identity, mailbox } from "./helpers.js";
after(() => pool.end());
test("failure cases, invitation boundaries and transactional safety", async (t) => {
  await migrate();
  const owner = await practice(),
    staff = await identity();
  const a = owner.agent;
  await t.test(
    "expired and revoked invitations reject consumption",
    async () => {
      const invitation = await call(a, "post", "/invitations", {
        email: staff.email,
        capabilities: ["tasks.complete"],
      });
      assert.equal(invitation.status, 201);
      const token = new URL(
        mailbox.findLast((m) => m.to === staff.email).url,
      ).hash.slice(7);
      await pool.query(
        "UPDATE invitations SET expires_at=now()-interval '1 second' WHERE id=$1",
        [invitation.body.id],
      );
      assert.equal(
        (await call(staff.agent, "post", "/invitations/accept", { token }))
          .status,
        400,
      );
      assert.equal(
        (
          await call(
            a,
            "post",
            "/invitations/" + invitation.body.id + "/revoke",
            {},
          )
        ).status,
        200,
      );
      assert.equal(
        (await call(staff.agent, "post", "/invitations/accept", { token }))
          .status,
        400,
      );
    },
  );
  await t.test(
    "wrong verified email cannot accept invitation or gain membership",
    async () => {
      const intended = await identity();
      await call(a, "post", "/invitations", {
        email: intended.email,
        capabilities: ["patients.view"],
      });
      const token = new URL(
        mailbox.findLast((m) => m.to === intended.email).url,
      ).hash.slice(7);
      assert.equal(
        (await call(staff.agent, "post", "/invitations/accept", { token }))
          .status,
        403,
      );
      assert.equal(
        (await call(staff.agent, "get", "/workspaces")).body.length,
        0,
      );
    },
  );
  await t.test("task versions and closed-state protections", async () => {
    const task = (
      await call(a, "post", "/tasks", {
        action: "Synthetic edit",
        kind: "task",
      })
    ).body;
    const edit = { action: "Changed", dueAt: null, version: 1 };
    assert.equal(
      (await call(a, "patch", "/tasks/" + task.id, edit)).status,
      200,
    );
    assert.equal(
      (await call(a, "patch", "/tasks/" + task.id, edit)).status,
      409,
    );
    assert.equal(
      (
        await call(a, "post", "/tasks/" + task.id + "/state", {
          status: "completed",
          version: 2,
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(a, "patch", "/tasks/" + task.id, { ...edit, version: 3 }))
        .status,
      409,
    );
  });
  await t.test(
    "export scoped and uncached; SQL search treats attack strings as data",
    async () => {
      const r = await call(a, "get", "/export?type=patients");
      assert.equal(r.status, 200);
      assert.equal(r.headers["cache-control"], "no-store");
      assert.deepEqual(r.body.records, []);
      assert.deepEqual(
        (
          await call(
            a,
            "get",
            "/patients?q=" + encodeURIComponent("%' OR 1=1; --"),
          )
        ).body,
        [],
      );
    },
  );
  await t.test("failed FK insert rolls back earlier write", async () => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query("INSERT INTO clients(account_id,name) VALUES($1,$2)", [
        owner.workspace.id,
        "Synthetic rollback",
      ]);
      await assert.rejects(
        c.query(
          "INSERT INTO patients(account_id,client_id,name,species) VALUES($1,$2,$3,$4)",
          [owner.workspace.id, randomUUID(), "Synthetic broken", "Dog"],
        ),
      );
      await c.query("ROLLBACK");
      assert.equal(
        (
          await c.query(
            "SELECT 1 FROM clients WHERE account_id=$1 AND name=$2",
            [owner.workspace.id, "Synthetic rollback"],
          )
        ).rowCount,
        0,
      );
    } finally {
      c.release();
    }
  });
  await t.test("concurrent walk-in creates one active encounter", async () => {
    const p = (
      await call(a, "post", "/patients", {
        name: "Synthetic walk-in",
        species: "Dog",
        clientName: "Synthetic client",
      })
    ).body;
    const results = await Promise.all([
      call(a, "post", "/visits", { patientId: p.id }),
      call(a, "post", "/visits", { patientId: p.id }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  });
});
