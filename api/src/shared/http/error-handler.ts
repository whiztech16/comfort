import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError, safeErrorInfo } from "../errors";
import { logger } from "../logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  const base = { success: false as const, requestId: req.requestId };

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      ...base,
      code: err.code,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      ...base,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const status = (err as { status?: number }).status;
  if (status === 413) {
    return res.status(413).json({ ...base, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" });
  }
  if (status === 400 && (err as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ ...base, code: "VALIDATION_ERROR", message: "Malformed JSON" });
  }

  // Everything below is an unexpected error: log a sanitized summary only.
  const info = safeErrorInfo(err);
  const context = { requestId: req.requestId, method: req.method, path: req.path, error: info };

  if (info.kind === "database") {
    // Client-caused database errors get clean 4xx answers, never details.
    if (info.code === "23505") {
      logger.warn(context, "Database conflict");
      return res.status(409).json({ ...base, code: "CONFLICT", message: "This item already exists" });
    }
    if (info.code === "23503") {
      logger.warn(context, "Database reference conflict");
      return res.status(409).json({ ...base, code: "CONFLICT", message: "The request conflicts with existing data" });
    }
    if (info.code === "22P02") {
      logger.warn(context, "Invalid identifier format");
      return res.status(400).json({ ...base, code: "VALIDATION_ERROR", message: "Invalid request" });
    }
  }

  logger.error(context, "Unhandled error");
  return res.status(500).json({ ...base, code: "INTERNAL_ERROR", message: "Something went wrong" });
};