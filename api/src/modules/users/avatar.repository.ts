import { eq } from "drizzle-orm";
import { db } from "../../db";
import { profiles } from "../../db/schema";

// Pass null, null to remove the avatar
export function replaceAvatar(userId: string, url: string | null, publicId: string | null) {
  return db.transaction(async (tx) => {
    const [old] = await tx
      .select({ id: profiles.avatarPublicId })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .for("update")
      .limit(1);
    if (!old) return null;

    const [profile] = await tx
      .update(profiles)
      .set({ avatarUrl: url, avatarPublicId: publicId, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning({
        displayName: profiles.displayName,
        username: profiles.username,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
      });
    return { oldPublicId: old.id, profile: profile! };
  });
}