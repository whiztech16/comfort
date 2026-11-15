import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { create, getOne, list, listMessages, markRead, remove, sendMessage } from "./conversations.controller";

const quarter = 15 * 60 * 1000;
const createLimiter = userLimiter(30, 60 * 60 * 1000);
const sendLimiter = userLimiter(120, quarter); // chats are chattier than posts
const readLimiter = userLimiter(300, quarter);
const deleteLimiter = userLimiter(30, 60 * 60 * 1000);

export const conversationsRouter = Router();

conversationsRouter.post("/", authenticate, createLimiter, requireOnboarded, create);
conversationsRouter.get("/", authenticate, readLimiter, requireOnboarded, list);
conversationsRouter.get("/:id", authenticate, readLimiter, requireOnboarded, getOne);
conversationsRouter.get("/:id/messages", authenticate, readLimiter, requireOnboarded, listMessages);
conversationsRouter.post("/:id/messages", authenticate, sendLimiter, requireOnboarded, sendMessage);
conversationsRouter.post("/:id/read", authenticate, readLimiter, requireOnboarded, markRead);
conversationsRouter.delete("/:id", authenticate, deleteLimiter, requireOnboarded, remove);