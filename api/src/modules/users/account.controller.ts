import type { RequestHandler } from "express";
import { env, isProd } from "../../config/env";
import { asyncHandler } from "../../shared/http/async-handler";
import { deleteAccountSchema } from "./account.validation";
import { deleteAccount } from "./account.service";

const cookie = { httpOnly: true, secure: isProd, sameSite: "lax", path: "/api/v1/auth" } as const;

export const removeAccount: RequestHandler = asyncHandler(async (req, res) => {
  await deleteAccount(req.auth!.userId, deleteAccountSchema.parse(req.body));
  res.clearCookie(env.REFRESH_COOKIE_NAME, cookie);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, message: "Account deleted", data: {} });
});