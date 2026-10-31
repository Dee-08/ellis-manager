import "./safety.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { pool } from "../server/db.js";
import { migrate } from "../db/migrate.js";
import { taskTransition, visitTransition } from "../server/domain.js";
import { app, call, practice, invite, password } from "./helpers.js";
after(() => pool.end());
test("clinical records, shared tasks, handovers and membership lifecycle", async (t) => {
  await migrate();
  const owner = await practice(),
    other = await practice("personal");
  const a = owner.agent;
  let patient, visit, note, task, member;
  await t.test(
    "registration persists across new app session; scoped reads and writes reject outsiders",
    async () => {
      const r = await call(a, "post", "/patients", {
        name: "Synthetic Milo",
        species: "Dog",
        clientName: "Synthetic Owner",
      });
      assert.equal(r.status, 201);
      patient = r.body;
      const fresh = request.agent(app);
      assert.equal(
        (
          await call(fresh, "post", "/auth/login", {
            email: owner.email,
            password,
          })
        ).status,
        200,
      );
      await call(fresh, "post", "/workspaces/select", {
        slug: owner.workspace.slug,
      });
      assert.equal(
        (await call(fresh, "get", "/patients/" + patient.id)).body.name,
        patient.name,
      );
      assert.equal(
        (await call(other.agent, "get", "/patients/" + patient.id)).status,
        404,
      );
      assert.equal(
        (await call(other.agent, "post", "/visits", { patientId: patient.id }))
          .status,
        404,
      );
      assert.equal((await a.post("/api/tasks").send({})).status, 403);
      assert.equal(
        (
          await call(a, "post", "/patients", {
            name: "Attack",
            species: "Dog",
            clientName: "X",
            account_id: other.workspace.id,
          })
        ).status,
        400,
      );
      await assert.rejects(
        pool.query(
          "INSERT INTO patients(account_id,client_id,name,species) VALUES($1,$2,$3,$4)",
          [other.workspace.id, patient.client_id, "Synthetic attack", "Dog"],
        ),
        (e) => e.code === "23503",
      );
    },
  );
  await t.test(
    "stale demographics and signed notes cannot overwrite history",
    async () => {
      const edit = { name: patient.name, species: "Dog", version: 1 };
      assert.equal(
        (await call(a, "patch", "/patients/" + patient.id, edit)).status,
        200,
      );
      assert.equal(
        (await call(a, "patch", "/patients/" + patient.id, edit)).status,
        409,
      );
      visit = (await call(a, "post", "/visits", { patientId: patient.id }))
        .body;
      note = (
        await call(a, "post", "/notes", {
          visitId: visit.id,
          content: "Synthetic clinical observation.",
        })
      ).body;
      assert.equal(
        (await call(a, "post", "/notes/" + note.id + "/sign", { version: 1 }))
          .status,
        200,
      );
      assert.equal(
        (
          await call(a, "patch", "/notes/" + note.id, {
            content: "Overwrite",
            version: 2,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(a, "post", "/notes", {
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
    "ending visit preserves follow-up; failed contact does not complete work",
    async () => {
      task = (
        await call(a, "post", "/tasks", {
          action: "Synthetic recovery call",
          kind: "follow_up",
          patientId: patient.id,
          visitId: visit.id,
          dueAt: "2020-01-01T12:00:00Z",
        })
      ).body;
      assert.equal(
        (
          await call(a, "post", "/visits/" + visit.id + "/state", {
            state: "ended",
            version: 1,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call(a, "post", "/tasks/" + task.id + "/contact", {
            channel: "phone",
            outcome: "No answer",
            version: 1,
          })
        ).status,
        201,
      );
      assert.equal(
        (await call(a, "get", "/tasks/" + task.id)).body.status,
        "open",
      );
      assert.equal(
        (await call(a, "get", "/tasks")).body.find((x) => x.id === task.id)
          .overdue,
        true,
      );
    },
  );
  await t.test(
    "concurrent task updates and shared claims have one winner",
    async () => {
      const responses = await Promise.all([
        call(a, "post", "/tasks/" + task.id + "/state", {
          status: "completed",
          version: 2,
        }),
        call(a, "post", "/tasks/" + task.id + "/state", {
          status: "completed",
          version: 2,
        }),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
      assert.equal(
        (
          await call(a, "post", "/tasks/" + task.id + "/state", {
            status: "open",
            version: 3,
            reason: "More work required",
          })
        ).status,
        200,
      );
      const claims = await Promise.all([
        call(a, "post", "/tasks/" + task.id + "/claim", { version: 4 }),
        call(a, "post", "/tasks/" + task.id + "/claim", { version: 4 }),
      ]);
      assert.deepEqual(claims.map((r) => r.status).sort(), [200, 409]);
    },
  );
  await t.test(
    "title optional; demographic staff cannot read notes, sign or export",
    async () => {
      member = await invite(a, [
        "patients.view",
        "tasks.complete",
        "tasks.create",
      ]);
      assert.equal(member.me.title, "");
      assert.equal(
        (await call(member.agent, "get", "/patients/" + patient.id)).body.notes
          .length,
        0,
      );
      assert.equal(
        (
          await call(member.agent, "post", "/notes/" + note.id + "/sign", {
            version: 2,
          })
        ).status,
        403,
      );
      assert.equal(
        (await call(member.agent, "get", "/export?type=notes")).status,
        403,
      );
      assert.equal((await call(member.agent, "get", "/audit")).status, 403);
    },
  );
  await t.test(
    "handover keeps current owner until recipient accepts",
    async () => {
      const r = await call(a, "post", "/tasks/" + task.id + "/handover", {
        toId: member.me.id,
        version: 5,
      });
      assert.equal(r.status, 201);
      assert.equal(
        (await call(a, "get", "/tasks/" + task.id)).body.owner_id,
        owner.me.id,
      );
      assert.equal(
        (
          await call(
            member.agent,
            "post",
            "/handovers/" + r.body.id + "/decide",
            { decision: "accepted" },
          )
        ).status,
        200,
      );
      assert.equal(
        (await call(member.agent, "get", "/tasks/" + task.id)).body.owner_id,
        member.me.id,
      );
      assert.equal(
        (
          await call(
            member.agent,
            "post",
            "/handovers/" + r.body.id + "/decide",
            { decision: "accepted" },
          )
        ).status,
        409,
      );
    },
  );
  await t.test(
    "revocation blocks active session, returns work to Shared and retains audit",
    async () => {
      assert.equal(
        (
          await call(a, "post", "/team/" + member.me.id + "/disable", {
            reason: "Synthetic revocation",
            reviewed: true,
            version: member.me.auth_version,
          })
        ).status,
        200,
      );
      assert.equal((await call(member.agent, "get", "/me")).status, 403);
      assert.equal(
        (await call(a, "get", "/tasks/" + task.id)).body.owner_id,
        null,
      );
      assert.ok(
        (await call(a, "get", "/audit")).body.some(
          (e) => e.action === "staff.disabled",
        ),
      );
      assert.equal(
        (
          await call(member.agent, "post", "/invitations/accept", {
            token: member.token,
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "ownership transfer revokes old sessions without granting clinical authority",
    async () => {
      const next = await invite(a, []);
      assert.equal(
        (
          await call(a, "post", "/team/" + owner.me.id + "/disable", {
            reason: "Invalid",
            reviewed: true,
            version: owner.me.auth_version,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(a, "post", "/ownership/transfer", {
            toId: next.me.id,
            confirmation: owner.workspace.slug,
          })
        ).status,
        200,
      );
      assert.equal((await call(a, "get", "/me")).status, 401);
      assert.equal((await call(next.agent, "get", "/me")).status, 401);
      await call(next.agent, "post", "/workspaces/select", {
        slug: owner.workspace.slug,
      });
      const me = (await call(next.agent, "get", "/me")).body;
      assert.equal(me.is_owner, true);
      assert.equal(me.capabilities.includes("notes.sign"), false);
      assert.equal(me.capabilities.includes("visits.manage"), false);
    },
  );
});
test("invalid transitions require explicit reasons", () => {
  assert.throws(() => taskTransition("blocked", "completed", ""));
  assert.throws(() => taskTransition("completed", "open", ""));
  assert.throws(() => visitTransition("ended", "in_consultation", ""));
  taskTransition("open", "completed", "");
});
