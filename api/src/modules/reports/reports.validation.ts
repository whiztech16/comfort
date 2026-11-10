import { z } from "zod";

const hasNoUnsafeChars = (v: string) => !/[\p{Cc}\p{Cf}]/u.test(v.replace(/[\n\r\t]/g, ""));

export const REPORT_REASONS = [
  "harassment",
  "hate_speech",
  "self_harm",
  "spam",
  "inappropriate",
  "impersonation",
  "other",
] as const;

const reason = z.enum(REPORT_REASONS);
const description = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .refine(hasNoUnsafeChars, "Description contains invalid characters")
  .optional();
const id = z.string().uuid();

export const createReportSchema = z.discriminatedUnion("targetType", [
  z.object({ targetType: z.literal("post"), targetId: id, reason, description }).strict(),
  z.object({ targetType: z.literal("comfort"), targetId: id, reason, description }).strict(),
  z.object({ targetType: z.literal("message"), targetId: id, reason, description }).strict(),
  z
    .object({
      targetType: z.literal("user"),
      username: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_]{3,20}$/, "Invalid username"),
      reason,
      description,
    })
    .strict(),
]);

export type CreateReportInput = z.infer<typeof createReportSchema>;