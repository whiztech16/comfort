import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  updateProfileSchema,
  updateSettingsSchema,
  usernameParamsSchema,
} from "./users.validation";
import * as service from "./users.service";

const send = (res: Response, data: unknown) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, message: "OK", data });
};

export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  const { username } = usernameParamsSchema.parse(req.params);
  send(res, { profile: await service.getPublicProfile(req.auth!.userId, username) });
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const input = updateProfileSchema.parse(req.body);
  send(res, { profile: await service.updateProfile(req.auth!.userId, input) });
});

export const getSettings: RequestHandler = asyncHandler(async (req, res) => {
  send(res, { settings: await service.getSettings(req.auth!.userId) });
});

export const updateSettings: RequestHandler = asyncHandler(async (req, res) => {
  const input = updateSettingsSchema.parse(req.body);
  send(res, { settings: await service.updateSettings(req.auth!.userId, input) });
});