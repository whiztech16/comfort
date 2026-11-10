import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { appreciate, getOne, open, received, sendComfort, sent } from "./comforts.controller";
import { blockComfortSender } from "../blocks/blocks.controller";
const hour = 60 * 60 * 1000;
const sendLimiter = userLimiter(30, hour);
const appreciateLimiter = userLimiter(30, hour);
const openLimiter = userLimiter(120, 15 * 60 * 1000);
const readLimiter = userLimiter(200, 15 * 60 * 1000);

export const comfortsRouter = Router();

comfortsRouter.post("/", authenticate, sendLimiter, requireOnboarded, sendComfort);
comfortsRouter.get("/received", authenticate, readLimiter, requireOnboarded, received);
comfortsRouter.get("/sent", authenticate, readLimiter, requireOnboarded, sent);
comfortsRouter.get("/:id", authenticate, readLimiter, requireOnboarded, getOne);
comfortsRouter.post("/:id/open", authenticate, openLimiter, requireOnboarded, open);
comfortsRouter.post("/:id/appreciation", authenticate, appreciateLimiter, requireOnboarded, appreciate);
comfortsRouter.post("/:id/block", authenticate, appreciateLimiter, requireOnboarded, blockComfortSender);