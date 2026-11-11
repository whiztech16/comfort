import type { Request, RequestHandler } from "express";

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// The avatar upload is the only multipart route
const MULTIPART_PATHS = new Set(["/api/v1/users/me/avatar"]);

// True only when bytes are really coming (empty POSTs still send Content-Length: 0)
const hasBody = (req: Request) =>
  req.headers["transfer-encoding"] !== undefined || Number(req.headers["content-length"] ?? 0) > 0;

export const jsonOnly: RequestHandler = (req, res, next) => {
  if (!BODY_METHODS.has(req.method) || MULTIPART_PATHS.has(req.path)) return next();
  // No body is fine; a body must be JSON
  if (!hasBody(req) || req.is("application/json")) return next();
  res.status(415).json({
    success: false,
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Content-Type must be application/json",
    requestId: req.requestId,
  });
};