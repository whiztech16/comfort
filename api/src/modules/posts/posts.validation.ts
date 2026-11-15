import { z } from "zod";

const hasNoUnsafeChars = (v: string) => !/[\p{Cc}\p{Cf}]/u.test(v.replace(/[\n\r\t]/g, ""));

export const createPostSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .max(2000, "Content must be 2000 characters or fewer")
      .refine(hasNoUnsafeChars, "Content contains invalid characters"),
    categoryId: z.string().uuid(),
    isAnonymous: z.boolean(),
    visibility: z.enum(["public", "private"]).default("public"),
  })
  .strict();

export const updatePostSchema = z.object({ content: createPostSchema.shape.content }).strict();

export const postParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(300).optional(),
  category: z
    .string()
    .regex(/^[a-z0-9-]{1,50}$/)
    .optional(),
});

export const profilePostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(300).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type ProfilePostsQuery = z.infer<typeof profilePostsQuerySchema>;