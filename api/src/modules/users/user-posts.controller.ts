import type { RequestHandler } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { profilePostsQuerySchema } from "../posts/posts.validation";
import { usernameParamsSchema } from "./users.validation";
import * as service from "./user-posts.service";

const ok = (data: unknown) => ({ success: true, message: "OK", data });

export const myPosts: RequestHandler = asyncHandler(async (req, res) => {
  const query = profilePostsQuerySchema.parse(req.query);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(ok(await service.getMyPosts(req.auth!.userId, query)));
});

export const userPosts: RequestHandler = asyncHandler(async (req, res) => {
  const { username } = usernameParamsSchema.parse(req.params);
  const query = profilePostsQuerySchema.parse(req.query);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(ok(await service.getPublicUserPosts(req.auth!.userId, username, query)));
});