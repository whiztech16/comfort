import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Migrations need a direct (non-pooled) connection
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: path.resolve("migrations") });
  console.log("Migrations applied");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : "unknown error");
  process.exitCode = 1;
} finally {
  await pool.end();
}