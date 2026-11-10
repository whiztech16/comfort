import { z } from "zod";

export const blockByUsernameSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{3,20}$/, "Invalid username"),
  })
  .strict();

export const blockParamsSchema = z.object({ id: z.string().uuid() }).strict();