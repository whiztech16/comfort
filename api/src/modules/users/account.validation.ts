import { z } from "zod";

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1).max(128).optional(),
    idToken: z.string().min(20).max(4096).optional(),
  })
  .strict()
  .refine((v) => (v.password === undefined) !== (v.idToken === undefined), {
    message: "Provide either password or idToken",
  });

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;