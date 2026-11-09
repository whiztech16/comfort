import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env";
import { safeErrorInfo } from "../shared/errors";
import { logger } from "../shared/logger";
import * as schema from "./schema";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
});

pool.on("error", (err) => {
  logger.warn({ error: safeErrorInfo(err) }, "Idle database client error");
});

export const db = drizzle({ client: pool, schema });