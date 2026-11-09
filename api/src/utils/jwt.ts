import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";

const ALGORITHM = "HS256" as const;

const payloadSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
});

export type AccessTokenPayload = z.infer<typeof payloadSchema>;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ sid: payload.sid }, env.JWT_ACCESS_SECRET, {
    algorithm: ALGORITHM,
    subject: payload.sub,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [ALGORITHM],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return payloadSchema.parse(decoded);
}