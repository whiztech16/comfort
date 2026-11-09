import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // Neon: pooled connection string for the running API
   DATABASE_URL: z
    .string()
    .url()
    .refine((u) => {
      const { hostname, searchParams } = new URL(u);
      return (
        ["localhost", "127.0.0.1"].includes(hostname) ||
        searchParams.get("sslmode") === "verify-full"
      );
    }, "DATABASE_URL must include ?sslmode=verify-full for any non-local database"),
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),

  FRONTEND_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REFRESH_COOKIE_NAME: z.string().min(1).default("comfort_rt"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  JWT_ISSUER: z.string().min(1).default("comfort-api"),
  JWT_AUDIENCE: z.string().min(1).default("comfort-web"),

  AT_REST_KEY_V1: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "AT_REST_KEY_V1 must be 32 bytes, base64"),
  AT_REST_ACTIVE_KEY_VERSION: z.coerce.number().int().min(1).default(1),

  GOOGLE_CLIENT_ID: optionalString,

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,

  EMAIL_HOST: optionalString,
  EMAIL_PORT: z.coerce.number().int().default(587),
  EMAIL_USER: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

if (isProd) {
  const missing = (
    [
      "GOOGLE_CLIENT_ID",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "EMAIL_HOST",
      "EMAIL_USER",
      "EMAIL_PASSWORD",
      "EMAIL_FROM",
      "REDIS_URL",
    ] as const
  ).filter((k) => !env[k]);

  if (missing.length > 0) {
    console.error(`Missing required production variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}