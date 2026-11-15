import { and, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db";
import {
  blocks,
  comforts,
  conversationParticipants,
  conversations,
  posts,
  profiles,
  userSettings,
  users,
} from "../../db/schema";

const meP = alias(conversationParticipants, "me_p");
const otherP = alias(conversationParticipants, "other_p");

export async function findBlockableUser(username: string) {
  const [row] = await db
    .select({ userId: profiles.userId, discoverable: userSettings.discoverableProfile })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .innerJoin(userSettings, eq(userSettings.userId, profiles.userId))
    .where(and(eq(profiles.username, username), eq(users.status, "active"), eq(users.onboardingCompleted, true)))
    .limit(1);
  return row ?? null;
}

export async function findReceivedComfortSender(comfortId: string, recipientId: string) {
  const [row] = await db
    .select({ senderId: comforts.senderId, isAnonymous: comforts.isAnonymous })
    .from(comforts)
    .where(and(eq(comforts.id, comfortId), eq(comforts.recipientId, recipientId)))
    .limit(1);
  return row ?? null;
}

// The other participant of a conversation the viewer belongs to
export async function findConversationCounterpart(conversationId: string, viewerId: string) {
  const [row] = await db
    .select({
      counterpartId: otherP.userId,
      comfortSenderId: comforts.senderId,
      comfortIsAnonymous: comforts.isAnonymous,
      postIsAnonymous: posts.isAnonymous,
    })
    .from(conversations)
    .innerJoin(meP, and(eq(meP.conversationId, conversations.id), eq(meP.userId, viewerId)))
    .innerJoin(otherP, and(eq(otherP.conversationId, conversations.id), ne(otherP.userId, viewerId)))
    .innerJoin(comforts, eq(comforts.id, conversations.sourceComfortId))
    .leftJoin(posts, eq(posts.id, comforts.postId))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  return row ?? null;
}

// Idempotent: an existing block keeps its original anonymity flag.
export async function insertBlock(blockerId: string, blockedId: string, isAnonymous: boolean) {
  await db
    .insert(blocks)
    .values({ blockerId, blockedId, isAnonymous })
    .onConflictDoNothing({ target: [blocks.blockerId, blocks.blockedId] });
}

export function listBlocks(blockerId: string) {
  return db
    .select({
      id: blocks.id,
      isAnonymous: blocks.isAnonymous,
      createdAt: blocks.createdAt,
      profile: {
        displayName: profiles.displayName,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(blocks)
    .leftJoin(profiles, eq(profiles.userId, blocks.blockedId))
    .where(eq(blocks.blockerId, blockerId))
    .orderBy(desc(blocks.createdAt), desc(blocks.id))
    .limit(200);
}

export async function deleteBlock(id: string, blockerId: string) {
  const rows = await db
    .delete(blocks)
    .where(and(eq(blocks.id, id), eq(blocks.blockerId, blockerId)))
    .returning({ id: blocks.id });
  return rows.length > 0;
}

// Used by the chat menu, which knows the conversation but not the block ID
export async function deleteBlockBetween(blockerId: string, blockedId: string) {
  await db.delete(blocks).where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
}