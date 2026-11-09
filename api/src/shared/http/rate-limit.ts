import { createHash } from "node:crypto";
import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { Redis } from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../../config/env";
import { ApiError } from "../errors";
import { logger } from "../logger";

type Key = (req: Request) => string;

const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 }) : null;

// Hash the IP via SHA-256 so raw IPs aren't stored in the rate-limit store
const hashIp = (ip: string) => createHash("sha256").update(ip).digest("hex").slice(0, 32);

const byIp: Key = (req) => hashIp(req.ip ?? "unknown");
const byIpAndEmail: Key = (req) => {
  const email: unknown = req.body?.email;
  const digest = typeof email === "string" ? createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16) : "none";
  return `${byIp(req)}|${digest}`;
};
const byUser: Key = (req) => req.auth?.userId ?? byIp(req);

const make = (name: string, minutes: number, limit: number, key: Key) =>
  rateLimit({
    windowMs: minutes * 60_000,
    limit,
    keyGenerator: key,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: redis
      ? new RedisStore({
          prefix: `rl:${name}:`,
          sendCommand: (cmd: string, ...args: string[]) => redis.call(cmd, ...args) as Promise<RedisReply>,
        })
      : undefined,
    handler: (req, _res, next) => {
      logger.warn({ event: "security.rate_limited", limiter: name, ip: req.ip });
      next(new ApiError(429, "RATE_LIMITED", "Too many requests"));
    },
  });

export const registerLimiter = make("register", 60, 5, byIp);
export const loginLimiter = make("login", 15, 10, byIpAndEmail);
export const loginIpLimiter = make("login-ip", 15, 30, byIp);
export const googleLimiter = make("google", 15, 10, byIp);
export const refreshLimiter = make("refresh", 15, 30, byIp);
export const forgotLimiter = make("forgot", 60, 5, byIpAndEmail);
export const resetLimiter = make("reset", 60, 5, byIp);
export const sensitiveLimiter = make("sensitive", 60, 10, byUser);