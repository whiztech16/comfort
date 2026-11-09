import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db";
import { safeErrorInfo } from "./shared/errors";
import { logger } from "./shared/logger";

const app = createApp();
const server = http.createServer(app);

async function start() {
  // Warm the Neon pool so the first request skips the serverless cold-start.
  try {
    await pool.query("SELECT 1");
    logger.info("Database connection warm");
  } catch (err) {
    logger.error({ error: safeErrorInfo(err) }, "Database warm-up failed, continuing anyway");
  }

  if (!server.listening) {
    server.listen(env.PORT, () => {
      logger.info(`comfort-api listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  }
}

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ error: safeErrorInfo(reason) }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ error: safeErrorInfo(err) }, "Uncaught exception");
  process.exit(1);
});

start().catch((err) => {
  logger.fatal({ error: safeErrorInfo(err) }, "Failed to start server");
  process.exit(1);
});