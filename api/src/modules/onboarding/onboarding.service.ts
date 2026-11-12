import { db } from "../../db";
import { ApiError } from "../../shared/errors";
import type { OnboardingInput } from "./onboarding.validation";
import * as repo from "./onboarding.repository";

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  try {
    return await db.transaction(async (tx) => {
      const user = await repo.lockUser(tx, userId);

      if (!user || user.status !== "active") {
        throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
      }
      if (user.onboardingCompleted) {
        throw new ApiError(409, "CONFLICT", "Onboarding has already been completed");
      }

      const profile = await repo.saveProfile(tx, userId, {
        displayName: input.displayName,
        username: input.username,
        bio: input.bio ? input.bio : null,
      });

      const settings = await repo.saveSettings(tx, userId, {
        discoverableProfile: input.discoverableProfile,
        allowPrivateMessages: input.allowPrivateMessages,
      });

      // Last write: any failure above rolls everything back and the account stays incomplete
      await repo.markOnboardingComplete(tx, userId);

      return {
        id: user.id,
        email: user.email,
        onboardingCompleted: true,
        profile: {
          displayName: profile!.displayName,
          username: profile!.username,
          bio: profile!.bio,
          avatarUrl: profile!.avatarUrl,
        },
        settings: {
          discoverableProfile: settings!.discoverableProfile,
          allowPrivateMessages: settings!.allowPrivateMessages,
        },
      };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "CONFLICT", "Username is already taken", [
        { path: "username", message: "Username is unavailable" },
      ]);
    }
    throw err;
  }
}