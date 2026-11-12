import { z } from "zod";

const RESERVED_USERNAMES = new Set([
  "me", "admin", "administrator", "api", "comfort", "support", "help",
  "settings", "system", "moderator", "mod", "root", "null", "undefined",
  "anonymous", "official", "staff", "security", "login", "register",
]);

// No control chars, zero-width/format chars, or angle brackets
const SAFE_TEXT = /^[^\p{Cc}\p{Cf}<>]+$/u;
const SAFE_BIO = /^[^\p{Cc}\p{Cf}<>]*$/u;

export const onboardingBodySchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .max(50, "Display name must be 50 characters or fewer")
      .regex(SAFE_TEXT, "Display name contains invalid characters"),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be 20 characters or fewer")
      .regex(
        /^[a-z][a-z0-9_]*$/,
        "Username must start with a letter and use only letters, numbers and underscores",
      )
      .refine((v) => !RESERVED_USERNAMES.has(v), "This username is not available"),
    bio: z
      .string()
      .trim()
      .max(160, "Bio must be 160 characters or fewer")
      .regex(SAFE_BIO, "Bio contains invalid characters")
      .optional(),
    discoverableProfile: z.boolean(),
    allowPrivateMessages: z.enum(["allowed", "requests_only", "off"]),
  })
  .strict(); // unknown fields (userId, onboardingCompleted...) are rejected with 422

export type OnboardingInput = z.infer<typeof onboardingBodySchema>;