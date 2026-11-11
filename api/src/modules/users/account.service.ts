import { db } from "../../db";
import { ApiError } from "../../shared/errors";
import { disconnectUser } from "../../sockets/emitter";
import { assertSensitiveAction } from "../auth/auth.service";
import type { DeleteAccountInput } from "./account.validation";
import * as repo from "./account.repository";

export async function deleteAccount(userId: string, proof: DeleteAccountInput) {
  await assertSensitiveAction(userId, proof);

  await db.transaction(async (tx) => {
    const user = await repo.lockUser(tx, userId);
    if (!user || user.status !== "active") {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    await repo.hidePosts(tx, userId);
    await repo.purgeUserData(tx, userId);
    await repo.markDeleted(tx, userId);
  });

  disconnectUser(userId);
}