import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { createPost, getFeed, getPost, removePost } from "./posts.controller";

const hour = 60 * 60 * 1000;
const createLimiter = userLimiter(20, hour);
const deleteLimiter = userLimiter(30, hour);
const readLimiter = userLimiter(200, 15 * 60 * 1000);

export const postsRouter = Router();

postsRouter.post("/", authenticate, createLimiter, requireOnboarded, createPost);
postsRouter.get("/", authenticate, readLimiter, requireOnboarded, getFeed);
postsRouter.get("/:id", authenticate, readLimiter, requireOnboarded, getPost);
postsRouter.delete("/:id", authenticate, deleteLimiter, requireOnboarded, removePost);