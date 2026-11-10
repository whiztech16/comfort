import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  appreciationSchema,
  comfortListQuerySchema,
  comfortParamsSchema,
  createComfortSchema,
} from "./comforts.validation";
import * as service from "./comforts.service";

const send = (res: Response, status: number, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

export const sendComfort: RequestHandler = asyncHandler(async (req, res) => {
  const comfort = await service.sendComfort(req.auth!.userId, createComfortSchema.parse(req.body));
  send(res, 201, { comfort }, "Comfort sent");
});

export const received: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.listComforts(req.auth!.userId, "received", comfortListQuerySchema.parse(req.query)));
});

export const sent: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.listComforts(req.auth!.userId, "sent", comfortListQuerySchema.parse(req.query)));
});

export const getOne: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = comfortParamsSchema.parse(req.params);
  send(res, 200, { comfort: await service.getComfort(req.auth!.userId, id) });
});

export const open: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = comfortParamsSchema.parse(req.params);
  send(res, 200, await service.openComfort(req.auth!.userId, id));
});

export const appreciate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = comfortParamsSchema.parse(req.params);
  const comfort = await service.appreciateComfort(req.auth!.userId, id, appreciationSchema.parse(req.body));
  send(res, 200, { comfort }, "Appreciation sent");
});