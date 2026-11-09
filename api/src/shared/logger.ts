import pino from "pino";
import { env } from "../config/env";
import { safeErrorInfo } from "./errors";

export const logger = pino({
  level: env.LOG_LEVEL,
  serializers: {
    err: safeErrorInfo, // even logger.error({ err }) can no longer print a stack or query
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "*.password",
      "*.newPassword",
      "*.currentPassword",
      "*.token",
      "*.idToken",
      "*.ciphertext",
      "*.privateKey",
      "*.encryptedPrivateKey",
    ],
    censor: "[redacted]",
  },
});