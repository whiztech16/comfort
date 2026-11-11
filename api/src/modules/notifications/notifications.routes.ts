import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { list, markAllRead, markRead, remove, unreadCount } from "./notifications.controller";

const quarter = 15 * 60 * 1000;
const readLimiter = userLimiter(300, quarter); // the badge count gets polled
const writeLimiter = userLimiter(120, quarter);

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, readLimiter, requireOnboarded, list);
notificationsRouter.get("/unread-count", authenticate, readLimiter, requireOnboarded, unreadCount);
notificationsRouter.post("/read-all", authenticate, writeLimiter, requireOnboarded, markAllRead);
notificationsRouter.patch("/:id/read", authenticate, writeLimiter, requireOnboarded, markRead);
notificationsRouter.delete("/:id", authenticate, writeLimiter, requireOnboarded, remove);