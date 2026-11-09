import type { Request, RequestHandler, Response } from "express";
import { env, isProd } from "../../config/env";
import { logger } from "../../shared/logger";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  TOKEN_PATTERN,
  changePasswordSchema,
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionParamsSchema,
} from "./auth.validation";
import * as service from "./auth.service";

type Session = { accessToken: string; expiresIn: number; refreshToken: string; refreshExpiresAt: Date };

const cookie = { httpOnly: true, secure: isProd, sameSite: "lax", path: "/api/v1/auth" } as const;
const ua = (req: Request) => req.get("user-agent");

const readCookie = (req: Request) => {
  const v: unknown = req.cookies?.[env.REFRESH_COOKIE_NAME];
  return typeof v === "string" && TOKEN_PATTERN.test(v) ? v : undefined;
};

const send = (res: Response, status: number, data: unknown = {}, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

const sendSession = (res: Response, status: number, s: Session, extra: object = {}) => {
  res.cookie(env.REFRESH_COOKIE_NAME, s.refreshToken, { ...cookie, expires: s.refreshExpiresAt });
  send(res, status, { accessToken: s.accessToken, expiresIn: s.expiresIn, ...extra });
};

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const r = await service.register(registerSchema.parse(req.body), ua(req));
  sendSession(res, 201, r, { user: r.user });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const r = await service.login(loginSchema.parse(req.body), ua(req));
  sendSession(res, 200, r, { user: r.user });
});

export const googleSignIn: RequestHandler = asyncHandler(async (req, res) => {
  const r = await service.googleSignIn(googleSchema.parse(req.body).idToken, ua(req));
  sendSession(res, 200, r, { user: r.user });
});

export const refresh: RequestHandler = asyncHandler(async (req, res, next) => {
  try {
    sendSession(res, 200, await service.refresh(readCookie(req)));
  } catch (err) {
    res.clearCookie(env.REFRESH_COOKIE_NAME, cookie);
    next(err);
  }
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  await service.logout(readCookie(req));
  res.clearCookie(env.REFRESH_COOKIE_NAME, cookie);
  send(res, 200);
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, { user: await service.getCurrentUser(req.auth!.userId) });
});

export const listSessions: RequestHandler = asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.auth!;
  const rows = await service.listSessions(userId);
  send(res, 200, { items: rows.map((s) => ({ ...s, current: s.id === sessionId })) });
});

export const revokeSession: RequestHandler = asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.auth!;
  const { id } = sessionParamsSchema.parse(req.params);
  await service.revokeSession(userId, id);
  if (id === sessionId) res.clearCookie(env.REFRESH_COOKIE_NAME, cookie);
  send(res, 200);
});

export const changePassword: RequestHandler = asyncHandler(async (req, res) => {
  const s = await service.changePassword(req.auth!.userId, changePasswordSchema.parse(req.body), ua(req));
  sendSession(res, 200, s);
});

export const forgotPassword: RequestHandler = (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  send(res, 200, {}, "If the email is registered, a reset link has been sent");
  service.requestPasswordReset(email).catch(() => logger.error({ event: "auth.forgot_password_failed" }));
};

export const resetPassword: RequestHandler = asyncHandler(async (req, res) => {
  await service.resetPassword(resetPasswordSchema.parse(req.body));
  res.clearCookie(env.REFRESH_COOKIE_NAME, cookie);
  send(res, 200);
});
