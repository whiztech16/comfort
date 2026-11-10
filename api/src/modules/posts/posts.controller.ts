import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { createPostSchema, feedQuerySchema, postParamsSchema } from "./posts.validation";
import * as service from "./posts.service";

const send = (res: Response, status: number, data: unknown, message = "OK") => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: true, message, data });
};

export const createPost: RequestHandler = asyncHandler(async (req, res) => {
  const post = await service.createPost(req.auth!.userId, createPostSchema.parse(req.body));
  send(res, 201, { post }, "Post created");
});

export const getFeed: RequestHandler = asyncHandler(async (req, res) => {
  send(res, 200, await service.getFeed(req.auth!.userId, feedQuerySchema.parse(req.query)));
});

export const getPost: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = postParamsSchema.parse(req.params);
  send(res, 200, { post: await service.getPost(req.auth!.userId, id) });
});

export const removePost: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = postParamsSchema.parse(req.params);
  await service.deletePost(req.auth!.userId, id);
  send(res, 200, {}, "Post deleted");
});