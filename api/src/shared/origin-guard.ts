import type { RequestHandler } from "express";
import { env } from "../../src/config/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Compare the origin form only, so a trailing slash in .env is harmless
const allowedOrigin = new URL(env.FRONTEND_URL).origin;

export const originGuard: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  // Writes must come from our frontend; a missing Origin is rejected too
  if (req.get("origin") === allowedOrigin) return next();
  res.status(403).json({
    success: false,
    code: "ORIGIN_NOT_ALLOWED",
    message: "Origin not allowed",
    requestId: req.requestId,
  });
};