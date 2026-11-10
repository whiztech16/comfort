import { type SQL, and, desc, eq, isNotNull, isNull, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db";
import { blocks, comforts, posts, profiles, userSettings } from "../../db/schema";
import type { Cursor } from "../../shared/cursor";

const senderProfile = alias(profiles, "sender_profile");
const recipientProfile = alias(profiles, "recipient_profile");

const columns = {
  id: comforts.id,
  senderId: comforts.senderId,
  recipientId: comforts.recipientId,
  postId: comforts.postId,
  contentCiphertext: comforts.contentCiphertext,
  contentNonce: comforts.contentNonce,
  keyVersion: comforts.keyVersion,
  isAnonymous: comforts.isAnonymous,
  openedAt: comforts.openedAt,
  appreciationType: comforts.appreciationType,
  appreciatedAt: comforts.appreciatedAt,
  createdAt: comforts.createdAt,
  cursorTs: sql<string>`${comforts.createdAt}::text`,
  postIsAnonymous: posts.isAnonymous,
  senderProfile: {
    displayName: senderProfile.displayName,
    username: senderProfile.username,
    avatarUrl: senderProfile.avatarUrl,
  },
  recipientProfile: {
    displayName: recipientProfile.displayName,
    username: recipientProfile.username,
    avatarUrl: recipientProfile.avatarUrl,
  },
};

const notBlocked: SQL = notExists(
  db
    .select({ one: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, comforts.senderId), eq(blocks.blockedId, comforts.recipientId)),
        and(eq(blocks.blockerId, comforts.recipientId), eq(blocks.blockedId, comforts.senderId)),
      ),
    ),
);

const base = () =>
  db
    .select(columns)
    .from(comforts)
    .leftJoin(senderProfile, eq(senderProfile.userId, comforts.senderId))
    .leftJoin(recipientProfile, eq(recipientProfile.userId, comforts.recipientId))
    .leftJoin(posts, eq(posts.id, comforts.postId));

export async function getMessagingPreference(userId: string) {
  const [row] = await db
    .select({ allowPrivateMessages: userSettings.allowPrivateMessages })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return row?.allowPrivateMessages ?? null;
}

export async function insertComfort(data: {
  id: string;
  senderId: string;
  recipientId: string;
  postId: string;
  contentCiphertext: string;
  contentNonce: string;
  keyVersion: number;
  isAnonymous: boolean;
}) {
  await db.insert(comforts).values(data);
}

export async function findComfortFor(id: string, viewerId: string) {
  const [row] = await base()
    .where(
      and(
        eq(comforts.id, id),
        or(eq(comforts.senderId, viewerId), eq(comforts.recipientId, viewerId)),
        notBlocked,
      ),
    )
    .limit(1);
  return row ?? null;
}

export function listComforts(opts: {
  viewerId: string;
  role: "received" | "sent";
  limit: number;
  cursor?: Cursor;
}) {
  const conditions: SQL[] = [
    opts.role === "received" ? eq(comforts.recipientId, opts.viewerId) : eq(comforts.senderId, opts.viewerId),
    notBlocked,
  ];
  if (opts.cursor) {
    conditions.push(
      sql`(${comforts.createdAt}, ${comforts.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`,
    );
  }
  return base()
    .where(and(...conditions))
    .orderBy(desc(comforts.createdAt), desc(comforts.id))
    .limit(opts.limit + 1);
}

// Returns true only for the request that actually set opened_at (R7, R8).
export async function markOpened(id: string, recipientId: string) {
  const rows = await db
    .update(comforts)
    .set({ openedAt: new Date() })
    .where(and(eq(comforts.id, id), eq(comforts.recipientId, recipientId), isNull(comforts.openedAt), notBlocked))
    .returning({ id: comforts.id });
  return rows.length > 0;
}

// Recipient only, after opening, once (R13).
export async function markAppreciated(
  id: string,
  recipientId: string,
  type: "this_helped" | "made_my_day" | "thank_you",
) {
  const rows = await db
    .update(comforts)
    .set({ appreciationType: type, appreciatedAt: new Date() })
    .where(
      and(
        eq(comforts.id, id),
        eq(comforts.recipientId, recipientId),
        isNotNull(comforts.openedAt),
        isNull(comforts.appreciationType),
        notBlocked,
      ),
    )
    .returning({ id: comforts.id });
  return rows.length > 0;
}

export type ComfortRow = NonNullable<Awaited<ReturnType<typeof findComfortFor>>>;