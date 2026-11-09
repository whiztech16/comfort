import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { ApiError } from "../shared/errors";
import { asyncHandler } from "../shared/http/async-handler";

export const requireOnboarded: RequestHandler = asyncHandler(async (req, _res, next) => {
  const [u] = await db
    .select({ status: users.status, done: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, req.auth!.userId))
    .limit(1);

  if (!u || u.status !== "active") throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  if (!u.done) throw new ApiError(403, "FORBIDDEN", "Complete onboarding to continue");
  next();
});