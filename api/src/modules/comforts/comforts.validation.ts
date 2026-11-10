import { z } from "zod";

const hasNoUnsafeChars = (v: string) => !/[\p{Cc}\p{Cf}]/u.test(v.replace(/[\n\r\t]/g, ""));

export const createComfortSchema = z
  .object({
    postId: z.string().uuid(),
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .max(2000, "Content must be 2000 characters or fewer")
      .refine(hasNoUnsafeChars, "Content contains invalid characters"),
    isAnonymous: z.boolean(),
  })
  .strict();

export const comfortParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const appreciationSchema = z
  .object({ type: z.enum(["this_helped", "made_my_day", "thank_you"]) })
  .strict();

export const comfortListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(300).optional(),
});

export type CreateComfortInput = z.infer<typeof createComfortSchema>;
export type AppreciationInput = z.infer<typeof appreciationSchema>;
export type ComfortListQuery = z.infer<typeof comfortListQuerySchema>;