import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const allowedOrigin = new URL(env.FRONTEND_URL).origin;

export const originGuard: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;

  // Browser requests that send an Origin header must match FRONTEND_URL
  if (origin) {
    if (origin === allowedOrigin) return next();

    return res.status(403).json({
      success: false,
      code: "CSRF_INVALID",
      message: "Request origin not allowed",
      requestId: req.requestId,
    });
  }

  // Sec-Fetch-Site check for modern browsers without explicit Origin
  if (req.headers["sec-fetch-site"] === "cross-site") {
    return res.status(403).json({
      success: false,
      code: "CSRF_INVALID",
      message: "Cross-site request blocked",
      requestId: req.requestId,
    });
  }

  return next();
};
