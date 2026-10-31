import { Router } from "express";
import { pool } from "./db.js";
import { throttle, hashToken } from "./auth.js";
import { z, parse, text, email, uuid, timezone } from "./validation.js";
import { Problem } from "./domain.js";

export const demo = Router();
demo.post("/demo-requests", throttle, async (req, res) => {
  const { key, ...b } = parse(
    z.object({
      key: uuid,
      name: text,
      email,
      phone: z.string().trim().max(40).default(""),
      practiceName: z.string().trim().max(120).default(""),
      practiceType: z.enum(["personal", "clinic"]),
      timezone,
      preferredTime: z.string().trim().max(200).default(""),
      details: z.string().trim().max(2000).default(""),
      consent: z.literal(true),
    }),
    req.body,
  );
  const fingerprint = hashToken(JSON.stringify(b));
  // A retry returns the original receipt; changed details with the same key fail.
  const result = await pool.query(
    `INSERT INTO demo_requests
    (command_key,payload_hash,name,email,phone,practice_name,practice_type,timezone,preferred_time,details)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT(command_key) DO UPDATE SET command_key=demo_requests.command_key
    WHERE demo_requests.payload_hash=EXCLUDED.payload_hash RETURNING id`,
    [
      key,
      fingerprint,
      b.name,
      b.email,
      b.phone,
      b.practiceName,
      b.practiceType,
      b.timezone,
      b.preferredTime,
      b.details,
    ],
  );
  if (!result.rowCount)
    throw new Problem(
      409,
      "This request was already saved with different details. Reload to make a new request.",
    );
  res
    .status(201)
    .json({
      id: result.rows[0].id,
      message:
        "Your demo request has been saved. Your preferred time is not yet confirmed.",
    });
});
