import "dotenv/config";

const test = process.env.TEST_DATABASE_URL;
if (!test) throw new Error("TEST_DATABASE_URL is not set. Tests need their own Neon branch.");

// Pooled and direct hosts differ only by "-pooler"
const hostOf = (url?: string) => (url ? new URL(url).host.replace("-pooler", "") : "");
if (hostOf(test) === hostOf(process.env.DATABASE_URL) || hostOf(test) === hostOf(process.env.DATABASE_URL_UNPOOLED)) {
  throw new Error("TEST_DATABASE_URL points at your dev database. Refusing to run tests.");
}

process.env.DATABASE_URL = test;
process.env.DATABASE_URL_UNPOOLED = test;
// Each test user gets its own fake IP via X-Forwarded-For, so IP rate limits don't collide
process.env.TRUST_PROXY = "1";