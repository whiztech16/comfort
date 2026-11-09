import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.DRIZZLE_TARGET === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL_UNPOOLED;

if (!url) {
  throw new Error("Missing migration database URL");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dbCredentials: { url },
});