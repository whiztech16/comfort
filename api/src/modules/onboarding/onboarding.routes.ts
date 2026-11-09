import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { onboard } from "./onboarding.controller";

const onboardingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? (req.ip || "unknown"),
  handler: (_req, res) => {
    res.status(429).json({ success: false, code: "RATE_LIMITED", message: "Too many attempts. Try again later." });
  },
});

export const onboardingRouter = Router();

onboardingRouter.post("/", authenticate, onboardingLimiter, onboard);