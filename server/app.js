import express from "express";
import helmet from "helmet";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { resolve } from "node:path";
import { pool } from "./db.js";
import { Problem } from "./domain.js";
import { auth, authenticated } from "./auth.js";
import { records } from "./records.js";
import { work } from "./work.js";
import { team } from "./team.js";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  const production = process.env.NODE_ENV === "production";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw new Error(
      "SESSION_SECRET must contain at least 32 random characters.",
    );
  if (production) app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: production ? undefined : false }));
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("Origin") !== process.env.APP_ORIGIN ||
        req.get("X-Ellis-Request") !== "1" ||
        !req.is("application/json"))
    )
      return next(
        new Problem(
          403,
          "Request origin could not be verified. Refresh this page and retry.",
        ),
      );
    next();
  });
  const Store = connectPg(session);
  app.use(
    "/api",
    session({
      name: "ellis.sid",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new Store({
        pool,
        createTableIfMissing: false,
        pruneSessionInterval: false,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: production,
        maxAge: 30 * 60 * 1000,
        path: "/",
      },
    }),
  );
  app.get("/api/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", scope: "coordination-companion" });
  });
  app.use("/api/auth", auth);
  app.use("/api", authenticated);
  app.get("/api/me", (req, res) => res.json(req.actor));
  app.use("/api", records, work, team);
  app.use("/api", (req, res, next) =>
    next(new Problem(404, "Record or endpoint not found.")),
  );
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  app.use((e, req, res, next) => {
    if (res.headersSent) return next(e);
    if (e.name === "ZodError")
      return res
        .status(400)
        .json({
          error: e.issues
            .map((x) => x.path.join(".") + ": " + x.message)
            .join("; "),
        });
    if (e.code === "23505")
      return res
        .status(409)
        .json({
          error:
            "This entry already exists. Review the existing record before retrying.",
        });
    if (["23503", "22P02", "23514"].includes(e.code))
      return res
        .status(400)
        .json({
          error: "A linked record or value is unavailable. Review your input.",
        });
    if (e.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON." });
    res
      .status(e.status || 500)
      .json({
        error: e.status
          ? e.message
          : "The request could not be completed. Your changes were not saved. Please retry.",
      });
  });
  return app;
}
