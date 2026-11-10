import rateLimit from "express-rate-limit";

export const userLimiter = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.auth!.userId,
    handler: (_req, res) => {
      res.status(429).json({ success: false, code: "RATE_LIMITED", message: "Too many requests. Try again later." });
    },
  });