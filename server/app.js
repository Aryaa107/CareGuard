/**
 * The Express application.
 *
 * Kept separate from `index.js` so it can be mounted in a test without
 * binding a port or connecting to a database.
 */
import express from "express";

import { config } from "./config.js";
import { mongoose } from "./db.js";
import { HttpError } from "./lib/http.js";

import authRoutes from "./routes/auth.js";
import careRoutes from "./routes/care.js";
import healthRoutes from "./routes/health.js";

export function createApp({ logRequests = config.env !== "test" } = {}) {
  const app = express();

  // Behind the Vite proxy the client is same-origin, but this also covers a
  // split deployment where the built SPA is served from a different host.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: false }));

  /** CORS headers. Harmless under the dev proxy, essential for a split deploy. */
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && origin === config.corsOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  if (logRequests) {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on("finish", () => {
        console.log(
          `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`
        );
      });
      next();
    });
  }

  /* -------------------------------------------------------------- routes */

  app.get("/api/status", (_req, res) => {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
      ok: mongoose.connection.readyState === 1,
      env: config.env,
      database: {
        state: states[mongoose.connection.readyState] ?? "unknown",
        name: mongoose.connection.name,
      },
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/care", careRoutes);
  app.use("/api/health", healthRoutes);

  /* ------------------------------------------------------ error handling */

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  // Express identifies error middleware by arity, so `_next` must stay in the
  // signature even though it is never called.
  app.use((err, req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: err.message,
        field: err.field,
        code: err.code,
      });
    }

    // A duplicate key means a unique index rejected the write — surface it as
    // a conflict rather than a 500.
    if (err?.code === 11000) {
      return res.status(409).json({ error: "That record already exists" });
    }

    // A malformed id or a schema violation is a client mistake, not a crash.
    if (err?.name === "CastError" || err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Something went wrong",
      ...(config.env === "development" ? { detail: err?.message } : {}),
    });
  });

  return app;
}

export default createApp;
