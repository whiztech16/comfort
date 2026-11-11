import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { notificationListQuerySchema, notificationParamsSchema } from "./notifications.validation";
import * as service from "./notifications.service";

const send = (res: Response, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, message, data });
};

export const list: RequestHandler = asyncHandler(async (req, res) => {
  send(res, await service.listNotifications(req.auth!.userId, notificationListQuerySchema.parse(req.query)));
});

export const unreadCount: RequestHandler = asyncHandler(async (req, res) => {
  send(res, await service.unreadCount(req.auth!.userId));
});

export const markRead: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = notificationParamsSchema.parse(req.params);
  send(res, { notification: await service.markRead(req.auth!.userId, id) });
});

export const markAllRead: RequestHandler = asyncHandler(async (req, res) => {
  send(res, await service.markAllRead(req.auth!.userId));
});

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = notificationParamsSchema.parse(req.params);
  await service.deleteNotification(req.auth!.userId, id);
  send(res, {}, "Notification deleted");
});