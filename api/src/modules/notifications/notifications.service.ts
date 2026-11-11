import { decodeCursor, encodeCursor } from "../../shared/cursor";
import { ApiError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { emitToUser } from "../../sockets/emitter";
import type { NotificationListQuery } from "./notifications.validation";
import * as repo from "./notifications.repository";

type NotificationRow = {
  id: string;
  type: repo.NotificationType;
  entityType: repo.EntityType;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
};

// Only IDs and flags: no sender or recipient identity, ever
const toDto = (n: NotificationRow) => ({
  id: n.id,
  type: n.type,
  entityType: n.entityType,
  entityId: n.entityId,
  isRead: n.isRead,
  createdAt: n.createdAt,
});

// Called by comforts and conversations; failures are logged, never thrown
export async function notify(
  recipientId: string,
  type: repo.NotificationType,
  entityType: repo.EntityType,
  entityId: string,
) {
  try {
    if (!(await repo.isEnabled(recipientId, type))) return;
    // One unread "new message" per conversation is enough
    if (type === "new_message" && (await repo.hasUnread(recipientId, type, entityId))) return;
    const row = await repo.insertNotification({ recipientId, type, entityType, entityId });
    emitToUser(recipientId, "notification:new", { notification: toDto(row) });
  } catch (err) {
    logger.error({ event: "notifications.create_failed", type, err });
  }
}

export async function listNotifications(userId: string, query: NotificationListQuery) {
  let cursor;
  if (query.cursor) {
    cursor = decodeCursor(query.cursor);
    if (!cursor) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [{ path: "cursor", message: "Invalid cursor" }]);
    }
  }
  const rows = await repo.listNotifications({ recipientId: userId, limit: query.limit, cursor });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];
  return {
    items: page.map(toDto),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.cursorTs, id: last.id }) : null,
    hasMore,
  };
}

export async function unreadCount(userId: string) {
  return { count: await repo.countUnread(userId) };
}

export async function markRead(userId: string, id: string) {
  const row = await repo.markRead(id, userId);
  if (!row) throw new ApiError(404, "NOT_FOUND", "Notification not found");
  return toDto(row);
}

export async function markAllRead(userId: string) {
  return { updated: await repo.markAllRead(userId) };
}

export async function deleteNotification(userId: string, id: string) {
  if (!(await repo.deleteOwn(id, userId))) throw new ApiError(404, "NOT_FOUND", "Notification not found");
}