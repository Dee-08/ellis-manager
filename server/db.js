import pg from "pg";
import { requestContext } from "./context.js";
import { Problem } from "./domain.js";
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});
export async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const actor = requestContext.getStore();
    if (actor) {
      await c.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [
        actor.account_id,
      ]);
      const p = (
        await c.query(
          "SELECT status,auth_version FROM principals WHERE account_id=$1 AND id=$2",
          [actor.account_id, actor.id],
        )
      ).rows[0];
      if (!p || p.status !== "active" || p.auth_version !== actor.auth_version)
        throw new Problem(401, "Your access has changed. Sign in again.");
    }
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function audit(c, actor, action, entity, id, metadata = {}) {
  await c.query(
    "INSERT INTO audit_events(account_id,actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6)",
    [actor.account_id, actor.id, action, entity, id, metadata],
  );
}
