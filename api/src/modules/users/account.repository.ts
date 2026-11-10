import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  deviceLinkRequests,
  keyBackups,
  notifications,
  passwordResetTokens,
  posts,
  profiles,
  refreshTokens,
  userKeys,
  users,
} from "../../db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockUser(tx: Tx, userId: string) {
  const [row] = await tx
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .for("update")
    .limit(1);
  return row ?? null;
}

export async function hidePosts(tx: Tx, userId: string) {
  await tx
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(eq(posts.authorId, userId));
}

export async function purgeUserData(tx: Tx, userId: string) {
  await tx.delete(profiles).where(eq(profiles.userId, userId));
  await tx.delete(userKeys).where(eq(userKeys.userId, userId));
  await tx.delete(keyBackups).where(eq(keyBackups.userId, userId));
  await tx.delete(deviceLinkRequests).where(eq(deviceLinkRequests.userId, userId));
  await tx.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await tx.delete(notifications).where(eq(notifications.recipientId, userId));
}

// Frees the email for re-registration and removes the password hash.
// googleSub is set to a placeholder because users_has_credential requires one credential.
export async function markDeleted(tx: Tx, userId: string) {
  await tx
    .update(users)
    .set({
      status: "deleted",
      email: `deleted-${userId}@deleted.invalid`,
      passwordHash: null,
      googleSub: `deleted:${userId}`,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}