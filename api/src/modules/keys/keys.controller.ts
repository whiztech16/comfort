import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  accountKeySchema,
  approveLinkRequestSchema,
  backupSchema,
  createLinkRequestSchema,
  linkParamsSchema,
} from "./keys.validation";
import * as service from "./keys.service";

// Key material is never cached
const send = (res: Response, status: number, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

export const putAccountKey: RequestHandler = asyncHandler(async (req, res) => {
  const { key, created } = await service.setAccountKey(req.auth!.userId, accountKeySchema.parse(req.body).publicKey);
  send(res, created ? 201 : 200, key, created ? "Account key saved" : "OK");
});

export const getAccountKey: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.getAccountKey(req.auth!.userId));
});

export const putBackup: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.putBackup(req.auth!.userId, backupSchema.parse(req.body)), "Backup saved");
});

export const getBackup: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.getBackup(req.auth!.userId));
});

export const createLinkRequest: RequestHandler = asyncHandler(async (req, res) => {
  const body = createLinkRequestSchema.parse(req.body);
  send(res, 201, await service.createLinkRequest(req.auth!.userId, body.ephemeralPublicKey), "Link request created");
});

export const getLinkRequest: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = linkParamsSchema.parse(req.params);
  send(res, 200, await service.getLinkRequest(req.auth!.userId, id));
});

export const approveLinkRequest: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = linkParamsSchema.parse(req.params);
  const body = approveLinkRequestSchema.parse(req.body);
  await service.approveLinkRequest(req.auth!.userId, id, body.encryptedPayload);
  send(res, 200, { status: "approved" }, "Device approved");
});