import { type SQL, and, desc, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db";
import {
  blocks,
  comforts,
  conversationParticipants,
  conversations,
  messages,
  posts,
  profiles,
  userKeys,
  users,
} from "../../db/schema";
import type { Cursor } from "../../shared/cursor";

// Aliases: "me" is the viewer, "other" and "cp_*" are the counterpart
const meP = alias(conversationParticipants, "me_p");
const otherP = alias(conversationParticipants, "other_p");
const cpProfile = alias(profiles, "cp_profile");
const cpKey = alias(userKeys, "cp_key");
const cpUser = alias(users, "cp_user");
const myKey = alias(userKeys, "my_key");

const columns = (viewerId: string) => ({
  id: conversations.id,
  createdAt: conversations.createdAt,
  lastMessageAt: conversations.lastMessageAt,
  sortTs: sql<string>`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})::text`,
  counterpartId: otherP.userId, // internal only, never sent to clients
  counterpartStatus: cpUser.status,
  comfortSenderId: comforts.senderId,
  comfortIsAnonymous: comforts.isAnonymous,
  postIsAnonymous: posts.isAnonymous,
  counterpartProfile: {
    displayName: cpProfile.displayName,
    username: cpProfile.username,
    avatarUrl: cpProfile.avatarUrl,
  },
  counterpartPublicKey: cpKey.publicKey,
  myKeyReady: sql<boolean>`${myKey.userId} is not null`,
  // A block in either direction locks the conversation
  blocked: sql<boolean>`exists (
    select 1 from ${blocks}
    where (${blocks.blockerId} = ${viewerId} and ${blocks.blockedId} = ${otherP.userId})
       or (${blocks.blockerId} = ${otherP.userId} and ${blocks.blockedId} = ${viewerId})
  )`,
  hasUnread: sql<boolean>`exists (
    select 1 from ${messages}
    where ${messages.conversationId} = ${conversations.id}
      and ${messages.senderId} <> ${viewerId}
      and (${meP.lastReadAt} is null or ${messages.createdAt} > ${meP.lastReadAt})
  )`,
});

// Inner joins on "me" mean non-participants never match
const base = (viewerId: string) =>
  db
    .select(columns(viewerId))
    .from(conversations)
    .innerJoin(meP, and(eq(meP.conversationId, conversations.id), eq(meP.userId, viewerId)))
    .innerJoin(otherP, and(eq(otherP.conversationId, conversations.id), ne(otherP.userId, viewerId)))
    .innerJoin(comforts, eq(comforts.id, conversations.sourceComfortId))
    .innerJoin(cpUser, eq(cpUser.id, otherP.userId))
    .leftJoin(posts, eq(posts.id, comforts.postId))
    .leftJoin(cpProfile, eq(cpProfile.userId, otherP.userId))
    .leftJoin(cpKey, eq(cpKey.userId, otherP.userId))
    .leftJoin(myKey, eq(myKey.userId, viewerId));

export async function findConversationFor(id: string, viewerId: string) {
  const [row] = await base(viewerId).where(eq(conversations.id, id)).limit(1);
  return row ?? null;
}

export function listConversations(opts: { viewerId: string; limit: number; cursor?: Cursor }) {
  const sortExpr = sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`;
  const conditions: SQL[] = [];
  if (opts.cursor) {
    conditions.push(sql`(${sortExpr}, ${conversations.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`);
  }
  return base(opts.viewerId)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${sortExpr} desc`, desc(conversations.id))
    .limit(opts.limit + 1);
}

// What the recipient needs to start a conversation from a Comfort
export async function findComfortForConversation(comfortId: string, recipientId: string) {
  const [row] = await db
    .select({
      senderId: comforts.senderId,
      openedAt: comforts.openedAt,
      senderStatus: users.status,
      blocked: sql<boolean>`exists (
        select 1 from ${blocks}
        where (${blocks.blockerId} = ${comforts.senderId} and ${blocks.blockedId} = ${comforts.recipientId})
           or (${blocks.blockerId} = ${comforts.recipientId} and ${blocks.blockedId} = ${comforts.senderId})
      )`,
      senderHasKey: sql<boolean>`exists (select 1 from ${userKeys} where ${userKeys.userId} = ${comforts.senderId})`,
      recipientHasKey: sql<boolean>`exists (select 1 from ${userKeys} where ${userKeys.userId} = ${comforts.recipientId})`,
    })
    .from(comforts)
    .innerJoin(users, eq(users.id, comforts.senderId))
    .where(and(eq(comforts.id, comfortId), eq(comforts.recipientId, recipientId)))
    .limit(1);
  return row ?? null;
}

// Conversation and both participants are created together or not at all
export function insertConversation(comfortId: string, senderId: string, recipientId: string) {
  return db.transaction(async (tx) => {
    const [c] = await tx.insert(conversations).values({ sourceComfortId: comfortId }).returning({ id: conversations.id });
    await tx.insert(conversationParticipants).values([
      { conversationId: c!.id, userId: senderId },
      { conversationId: c!.id, userId: recipientId },
    ]);
    return c!.id;
  });
}

export function listMessages(opts: { conversationId: string; viewerId: string; limit: number; cursor?: Cursor }) {
  const conditions: SQL[] = [eq(messages.conversationId, opts.conversationId)];
  if (opts.cursor) {
    conditions.push(sql`(${messages.createdAt}, ${messages.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`);
  }
  return db
    .select({
      id: messages.id,
      ciphertext: messages.ciphertext,
      nonce: messages.nonce,
      senderWrappedKey: messages.senderWrappedKey,
      recipientWrappedKey: messages.recipientWrappedKey,
      createdAt: messages.createdAt,
      cursorTs: sql<string>`${messages.createdAt}::text`,
      isMine: sql<boolean>`${messages.senderId} = ${opts.viewerId}`,
    })
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(opts.limit + 1);
}

// Insert, bump the conversation, and mark the sender as caught up, all atomically
export function createMessage(
  conversationId: string,
  senderId: string,
  data: { ciphertext: string; nonce: string; senderWrappedKey: string; recipientWrappedKey: string },
) {
  return db.transaction(async (tx) => {
    const [msg] = await tx
      .insert(messages)
      .values({ conversationId, senderId, ...data })
      .returning({
        id: messages.id,
        ciphertext: messages.ciphertext,
        nonce: messages.nonce,
        senderWrappedKey: messages.senderWrappedKey,
        recipientWrappedKey: messages.recipientWrappedKey,
        createdAt: messages.createdAt,
      });
    await tx.update(conversations).set({ lastMessageAt: sql`now()` }).where(eq(conversations.id, conversationId));
    await tx
      .update(conversationParticipants)
      .set({ lastReadAt: sql`now()` })
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, senderId)));
    return msg!;
  });
}

export async function markRead(conversationId: string, userId: string) {
  const [row] = await db
    .update(conversationParticipants)
    .set({ lastReadAt: sql`now()` })
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)))
    .returning({ readAt: conversationParticipants.lastReadAt });
  return row?.readAt ?? null;
}

export type ConversationRow = NonNullable<Awaited<ReturnType<typeof findConversationFor>>>;