import { z } from "zod";

// Field rules for profile data. Keep in sync with the onboarding schema.
const profileFields = z.object({
  displayName: z.string().trim().min(1).max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Invalid username"),
  bio: z.string().trim().max(160),
});

export const usernameParamsSchema = z
  .object({
    username: profileFields.shape.username,
  })
  .strict();

export const updateProfileSchema = profileFields
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field" });

export const updateSettingsSchema = z
  .object({
    notifyNewComforts: z.boolean(),
    notifyNewMessages: z.boolean(),
    notifyAppreciation: z.boolean(),
    appearance: z.enum(["system", "light", "dark"]),
    allowPrivateMessages: z.enum(["allowed", "requests_only", "off"]),
    discoverableProfile: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field" });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;