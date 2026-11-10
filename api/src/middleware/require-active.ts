import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { ApiError } from "../shared/errors";
import { asyncHandler } from "../shared/http/async-handler";

// Status check only, for routes used before onboarding is finished
export const requireActive: RequestHandler = asyncHandler(async (req, _res, next) => {
  const [u] = await db.select({ status: users.status }).from(users).where(eq(users.id, req.auth!.userId)).limit(1);
  if (!u || u.status !== "active") throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  next();
});