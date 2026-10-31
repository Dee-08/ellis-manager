import "./safety.js";
import request from "supertest";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
export const mailbox = [];
export const app = createApp({ deliverMail: async (m) => mailbox.push(m) });
export const password = "Synthetic-fixture-password-294!";
export const call = (agent, method, path, body) => {
  const request = agent[method]("/api" + path);
  return body === undefined
    ? request
    : request
        .set("Origin", process.env.APP_ORIGIN)
        .set("X-Ellis-Request", "1")
        .send(body);
};
export async function identity() {
  const agent = request.agent(app),
    email = randomUUID() + "@example.test";
  assert.equal(
    (
      await call(agent, "post", "/auth/register", {
        name: "Synthetic Member",
        email,
        password,
        intent: "personal",
      })
    ).status,
    202,
  );
  const token = new URL(mailbox.findLast((m) => m.to === email).url).hash.slice(
    7,
  );
  assert.equal(
    (await call(agent, "post", "/auth/verify", { token })).status,
    200,
  );
  return { agent, email };
}
export async function practice(kind = "clinic", clinical = true) {
  const result = await identity();
  const slug = "test-" + randomUUID().slice(0, 12);
  const r = await call(result.agent, "post", "/workspaces", {
    kind,
    clinical,
    slug,
    name: "Synthetic practice",
    country: "NG",
    currency: "NGN",
    timezone: "Africa/Lagos",
    key: randomUUID(),
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return {
    ...result,
    workspace: r.body.workspace,
    me: (await call(result.agent, "get", "/me")).body,
  };
}
export async function invite(owner, capabilities) {
  const result = await identity();
  const r = await call(owner, "post", "/invitations", {
    email: result.email,
    capabilities,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const token = new URL(
    mailbox.findLast((m) => m.to === result.email).url,
  ).hash.slice(7);
  assert.equal(
    (await call(result.agent, "post", "/invitations/accept", { token })).status,
    200,
  );
  return {
    ...result,
    token,
    invitation: r.body.id,
    me: (await call(result.agent, "get", "/me")).body,
  };
}
