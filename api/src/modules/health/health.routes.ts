import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { logger } from "../../shared/logger";

export const healthRouter = Router();

// Liveness: the process is up
healthRouter.get("/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ status: "ok" });
});

// Readiness: the database answers in time
healthRouter.get("/ready", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 2000);
      }),
    ]);
    // TODO: ping Redis here once it's wired in
    res.status(200).json({ status: "ready" });
  } catch {
    // No details to the client; they stay in the logs
    logger.error({ event: "ready.failed" });
    res.status(503).json({ status: "not_ready" });
  } finally {
    clearTimeout(timer);
  }
});