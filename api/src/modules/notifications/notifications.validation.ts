import { z } from "zod";

export const notificationParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(300).optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;