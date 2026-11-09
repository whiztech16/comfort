import { eq } from "drizzle-orm";
import { db } from "../../db";
import { profiles, userSettings, users } from "../../db/schema";

export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockUser(tx: DbTx, userId: string) {
  const [row] = await tx
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      onboardingCompleted: users.onboardingCompleted,
    })
    .from(users)
    .where(eq(users.id, userId))
    .for("update")
    .limit(1);
  return row ?? null;
}

export async function saveProfile(
  tx: DbTx,
  userId: string,
  data: { displayName: string; username: string; bio: string | null },
) {
  const [row] = await tx
    .insert(profiles)
    .values({ userId, ...data })
    .onConflictDoUpdate({ target: profiles.userId, set: { ...data, updatedAt: new Date() } })
    .returning({
      displayName: profiles.displayName,
      username: profiles.username,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
    });
  return row;
}

export async function saveSettings(
  tx: DbTx,
  userId: string,
  data: {
    discoverableProfile: boolean;
    allowPrivateMessages: "allowed" | "requests_only" | "off";
  },
) {
  const [row] = await tx
    .insert(userSettings)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning({
      discoverableProfile: userSettings.discoverableProfile,
      allowPrivateMessages: userSettings.allowPrivateMessages,
    });
  return row;
}

export async function markOnboardingComplete(tx: DbTx, userId: string) {
  await tx
    .update(users)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
}