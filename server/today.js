import { Router } from "express";
import { pool } from "./db.js";
export const today = Router();
today.get("/today", async (req, res) => {
  const actor = req.actor;
  const visits = actor.capabilities.includes("patients.view")
    ? (
        await pool.query(
          "SELECT v.id,v.patient_id,v.state,v.arrived_at,p.name AS patient_name FROM visits v JOIN patients p ON p.account_id=v.account_id AND p.id=v.patient_id WHERE v.account_id=$1 AND v.state IN ('waiting','in_consultation') ORDER BY v.arrived_at LIMIT 50",
          [actor.account_id],
        )
      ).rows
    : null;
  const tasks = (
    await pool.query(
      "SELECT t.id,t.action,t.kind,t.status,t.due_at,t.owner_id,COALESCE(p.name,'Shared') AS owner_name,(t.due_at IS NOT NULL AND t.due_at<now()) AS overdue FROM tasks t LEFT JOIN principals p ON p.account_id=t.account_id AND p.id=t.owner_id WHERE t.account_id=$1 AND t.status NOT IN ('completed','cancelled') AND ($2 OR t.owner_id=$3 OR t.owner_id IS NULL) ORDER BY t.due_at NULLS LAST,t.created_at LIMIT 50",
      [actor.account_id, actor.capabilities.includes("tasks.team"), actor.id],
    )
  ).rows;
  res.json({ visits, tasks, limit: 50 });
});
