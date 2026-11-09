import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { getProfile, getSettings, updateProfile, updateSettings } from "./users.controller";

const limiter = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.auth?.userId ?? (req.ip || "unknown"),
    handler: (_req, res) => {
      res.status(429).json({ success: false, code: "RATE_LIMITED", message: "Too many requests. Try again later." });
    },
  });

const readLimiter = limiter(120, 15 * 60 * 1000); // also slows username scraping
const writeLimiter = limiter(20, 60 * 60 * 1000);

export const usersRouter = Router();
usersRouter.patch("/me/profile", authenticate, writeLimiter, requireOnboarded, updateProfile);
usersRouter.get("/me/settings", authenticate, readLimiter, requireOnboarded, getSettings);
usersRouter.patch("/me/settings", authenticate, writeLimiter, requireOnboarded, updateSettings);
usersRouter.get("/:username", authenticate, readLimiter, requireOnboarded, getProfile);

export const settingsRouter = Router();
settingsRouter.get("/", authenticate, readLimiter, requireOnboarded, getSettings);
settingsRouter.patch("/", authenticate, writeLimiter, requireOnboarded, updateSettings);