import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { blockByUsernameSchema, blockParamsSchema } from "./blocks.validation";
import * as service from "./blocks.service";

const send = (res: Response, status: number, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

export const blockUser: RequestHandler = asyncHandler(async (req, res) => {
  await service.blockByUsername(req.auth!.userId, blockByUsernameSchema.parse(req.body).username);
  send(res, 201, { blocked: true }, "User blocked");
});

export const blockComfortSender: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = blockParamsSchema.parse(req.params);
  await service.blockComfortSender(req.auth!.userId, id);
  send(res, 201, { blocked: true }, "Sender blocked");
});

export const listBlocks: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, { items: await service.listBlocks(req.auth!.userId) });
});

export const unblock: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = blockParamsSchema.parse(req.params);
  await service.unblock(req.auth!.userId, id);
  send(res, 200, {}, "User unblocked");
});