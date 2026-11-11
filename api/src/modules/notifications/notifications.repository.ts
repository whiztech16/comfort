import { type SQL, and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { notifications, userSettings } from "../../db/schema";
import type { Cursor } from "../../shared/cursor";

export type NotificationType = "new_comfort" | "new_message" | "new_appreciation";
export type EntityType = "comfort" | "conversation";

// Which setting switches each type off
const SETTING = {
  new_comfort: userSettings.notifyNewComforts,
  new_message: userSettings.notifyNewMessages,
  new_appreciation: userSettings.notifyAppreciation,
} as const;

const columns = {
  id: notifications.id,
  type: notifications.type,
  entityType: notifications.entityType,
  entityId: notifications.entityId,
  isRead: notifications.isRead,
  createdAt: notifications.createdAt,
};

export async function isEnabled(userId: string, type: NotificationType) {
  const [row] = await db.select({ on: SETTING[type] }).from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return row?.on ?? false;
}

export async function hasUnread(recipientId: string, type: NotificationType, entityId: string) {
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.type, type),
        eq(notifications.entityId, entityId),
        eq(notifications.isRead, false),
      ),
    )
    .limit(1);
  return !!row;
}

export async function insertNotification(data: {
  recipientId: string;
  type: NotificationType;
  entityType: EntityType;
  entityId: string;
}) {
  const [row] = await db.insert(notifications).values(data).returning(columns);
  return row!;
}

export function listNotifications(opts: { recipientId: string; limit: number; cursor?: Cursor }) {
  const conditions: SQL[] = [eq(notifications.recipientId, opts.recipientId)];
  if (opts.cursor) {
    conditions.push(
      sql`(${notifications.createdAt}, ${notifications.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`,
    );
  }
  return db
    .select({ ...columns, cursorTs: sql<string>`${notifications.createdAt}::text` })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(opts.limit + 1);
}

export async function countUnread(recipientId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)));
  return row?.n ?? 0;
}

// Repeating it is harmless: an already-read notification still matches
export async function markRead(id: string, recipientId: string) {
  const [row] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)))
    .returning(columns);
  return row ?? null;
}

export async function markAllRead(recipientId: string) {
  const rows = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)))
    .returning({ id: notifications.id });
  return rows.length;
}

export async function deleteOwn(id: string, recipientId: string) {
  const rows = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)))
    .returning({ id: notifications.id });
  return rows.length > 0;
}