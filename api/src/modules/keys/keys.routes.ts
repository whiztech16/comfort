import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireActive } from "../../middleware/require-active";
import { userLimiter } from "../../shared/http/user-limiter";
import {
  approveLinkRequest,
  createLinkRequest,
  getAccountKey,
  getBackup,
  getLinkRequest,
  putAccountKey,
  putBackup,
} from "./keys.controller";

const hour = 60 * 60 * 1000;
const quarter = 15 * 60 * 1000;

export const keysRouter = Router();

// No requireOnboarded: the keypair is created during onboarding
keysRouter.put("/account", authenticate, userLimiter(10, hour), requireActive, putAccountKey);
keysRouter.get("/account", authenticate, userLimiter(120, quarter), requireActive, getAccountKey);

keysRouter.put("/backup", authenticate, userLimiter(10, hour), requireActive, putBackup);
keysRouter.get("/backup", authenticate, userLimiter(10, hour), requireActive, getBackup);

keysRouter.post("/link-requests", authenticate, userLimiter(10, hour), requireActive, createLinkRequest);
keysRouter.get("/link-requests/:id", authenticate, userLimiter(300, quarter), requireActive, getLinkRequest);
keysRouter.post("/link-requests/:id/approve", authenticate, userLimiter(20, hour), requireActive, approveLinkRequest);