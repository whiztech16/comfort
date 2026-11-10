import rateLimit from "express-rate-limit";

// 300 requests per 15 min per IP. In-memory for now; move to the Redis store once Redis is wired
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
      requestId: req.requestId,
    });
  },
});