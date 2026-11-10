import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { blocks, comforts, profiles, userSettings, users } from "../../db/schema";

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