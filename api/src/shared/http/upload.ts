import type { RequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../errors";

const MAX_BYTES = 2 * 1024 * 1024;

// One file in the "avatar" field, nothing else, held in memory.
// fields: 0 and files: 1 enforce the single-file rule; parts leaves headroom.
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 0, parts: 2, fieldNameSize: 30 },
}).single("avatar");

const invalid = (message: string) =>
  new ApiError(422, "VALIDATION_ERROR", "Invalid request", [{ path: "avatar", message }]);

export const avatarUpload: RequestHandler = (req, res, next) => {
  parser(req, res, (err?: unknown) => {
    if (!err) return next();
    console.log("multer error:", err); // temporary, remove once tests pass
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(413, "PAYLOAD_TOO_LARGE", "Image must be 2 MB or smaller"));
    }
    // Wrong field name, extra parts, or a malformed multipart body
    next(invalid("Send exactly one image in the 'avatar' field"));
  });
};