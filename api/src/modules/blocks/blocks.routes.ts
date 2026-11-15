import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import {
  blockConversation,
  blockUser,
  listBlocks,
  unblock,
  unblockConversation,
} from "./blocks.controller";

const writeLimiter = userLimiter(30, 60 * 60 * 1000);
const readLimiter = userLimiter(120, 15 * 60 * 1000);

export const blocksRouter = Router();

blocksRouter.post("/", authenticate, writeLimiter, requireOnboarded, blockUser);
blocksRouter.get("/", authenticate, readLimiter, requireOnboarded, listBlocks);
blocksRouter.post("/conversation/:id", authenticate, writeLimiter, requireOnboarded, blockConversation);
blocksRouter.delete("/conversation/:id", authenticate, writeLimiter, requireOnboarded, unblockConversation);
blocksRouter.delete("/:id", authenticate, writeLimiter, requireOnboarded, unblock);