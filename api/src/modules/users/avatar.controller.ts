import type { RequestHandler, Response } from "express";
import { ApiError } from "../../shared/errors";
import { asyncHandler } from "../../shared/http/async-handler";
import * as service from "./avatar.service";

const send = (res: Response, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, message, data });
};

export const uploadAvatar: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [{ path: "avatar", message: "Avatar image is required" }]);
  }
  send(res, { profile: await service.setAvatar(req.auth!.userId, req.file.buffer) }, "Avatar updated");
});

// Idempotent: removing a missing avatar still succeeds
export const removeAvatar: RequestHandler = asyncHandler(async (req, res) => {
  send(res, { profile: await service.removeAvatar(req.auth!.userId) }, "Avatar removed");
});