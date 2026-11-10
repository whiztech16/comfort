import type { RequestHandler } from "express";

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// The avatar upload is the only multipart route
const MULTIPART_PATHS = new Set(["/api/v1/users/me/avatar"]);

export const jsonOnly: RequestHandler = (req, res, next) => {
  if (!BODY_METHODS.has(req.method) || MULTIPART_PATHS.has(req.path)) return next();
  // req.is() is null with no body and false when the body isn't JSON
  if (req.is("application/json") !== false) return next();
  res.status(415).json({
    success: false,
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Content-Type must be application/json",
    requestId: req.requestId,
  });
};