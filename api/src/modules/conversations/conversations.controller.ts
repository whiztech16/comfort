import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  conversationParamsSchema,
  createConversationSchema,
  pageQuerySchema,
  sendMessageSchema,
} from "./conversations.validation";
import * as service from "./conversations.service";

const send = (res: Response, status: number, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const { comfortId } = createConversationSchema.parse(req.body);
  send(res, 201, { conversation: await service.createConversation(req.auth!.userId, comfortId) }, "Conversation created");
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.listConversations(req.auth!.userId, pageQuerySchema.parse(req.query)));
});

export const getOne: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = conversationParamsSchema.parse(req.params);
  send(res, 200, { conversation: await service.getConversation(req.auth!.userId, id) });
});

export const listMessages: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = conversationParamsSchema.parse(req.params);
  send(res, 200, await service.listMessages(req.auth!.userId, id, pageQuerySchema.parse(req.query)));
});

export const sendMessage: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = conversationParamsSchema.parse(req.params);
  const message = await service.sendMessage(req.auth!.userId, id, sendMessageSchema.parse(req.body));
  send(res, 201, { message }, "Message sent");
});

export const markRead: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = conversationParamsSchema.parse(req.params);
  send(res, 200, await service.markRead(req.auth!.userId, id));
});