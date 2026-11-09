import { and, eq, notExists, or } from "drizzle-orm";
import { db } from "../../db";
import { blocks, profiles, userSettings, users } from "../../db/schema";

export async function findPublicProfile(username: string, viewerId: string) {
  const [row] = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      username: profiles.username,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      discoverable: userSettings.discoverableProfile,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .innerJoin(userSettings, eq(userSettings.userId, profiles.userId))
    .where(
      and(
        eq(profiles.username, username),
        eq(users.status, "active"),
        eq(users.onboardingCompleted, true),
        notExists(
          db
            .select({ one: blocks.id })
            .from(blocks)
            .where(
              or(
                and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, profiles.userId)),
                and(eq(blocks.blockerId, profiles.userId), eq(blocks.blockedId, viewerId)),
              ),
            ),
        ),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; username?: string; bio?: string | null },
) {
  const [row] = await db
    .update(profiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning({
      displayName: profiles.displayName,
      username: profiles.username,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
    });
  return row ?? null;
}

const settingsColumns = {
  notifyNewComforts: userSettings.notifyNewComforts,
  notifyNewMessages: userSettings.notifyNewMessages,
  notifyAppreciation: userSettings.notifyAppreciation,
  appearance: userSettings.appearance,
  allowPrivateMessages: userSettings.allowPrivateMessages,
  discoverableProfile: userSettings.discoverableProfile,
};

export async function getSettings(userId: string) {
  const [row] = await db.select(settingsColumns).from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return row ?? null;
}

export async function updateSettings(
  userId: string,
  patch: Partial<{
    notifyNewComforts: boolean;
    notifyNewMessages: boolean;
    notifyAppreciation: boolean;
    appearance: "system" | "light" | "dark";
    allowPrivateMessages: "allowed" | "requests_only" | "off";
    discoverableProfile: boolean;
  }>,
) {
  const [row] = await db
    .update(userSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning(settingsColumns);
  return row ?? null;
}