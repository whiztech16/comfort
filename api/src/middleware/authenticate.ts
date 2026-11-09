import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../shared/errors";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
  }

  try {
    const { sub, sid } = verifyAccessToken(header.slice(7));
    req.auth = { userId: sub, sessionId: sid };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "TOKEN_EXPIRED", "Access token expired"));
    }
    return next(new ApiError(401, "TOKEN_INVALID", "Invalid access token"));
  }
};