import { db } from "../../db";
import { deleteAvatar } from "../../services/storage.service";
import { ApiError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { disconnectUser } from "../../sockets/emitter";
import { assertSensitiveAction } from "../auth/auth.service";
import type { DeleteAccountInput } from "./account.validation";
import * as repo from "./account.repository";

export async function deleteAccount(userId: string, proof: DeleteAccountInput) {
  await assertSensitiveAction(userId, proof);

  const avatarPublicId = await db.transaction(async (tx) => {
    const user = await repo.lockUser(tx, userId);
    if (!user || user.status !== "active") {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }
    // Read the image ID before the profile row is purged
    const avatar = await repo.findAvatarPublicId(tx, userId);

    await repo.hidePosts(tx, userId);
    await repo.purgeUserData(tx, userId);
    await repo.markDeleted(tx, userId);
    return avatar;
  });

  disconnectUser(userId); // close any open sockets

  // Best-effort: the account is already gone, so a failure only gets logged
  if (avatarPublicId) {
    await deleteAvatar(avatarPublicId).catch(() =>
      logger.warn({ event: "avatar.cleanup_failed", publicId: avatarPublicId }),
    );
  }
}