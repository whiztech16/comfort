import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../shared/logger";
import { setIo } from "./emitter";
import { findSocketUser, isParticipant } from "./queries";

const MAX_CONVERSATION_ROOMS = 20;
const roomSchema = z.object({ conversationId: z.string().uuid() }).strict();

// Tiny per-socket limiter: at most `max` events per `windowMs`
function makeLimiter(max: number, windowMs: number) {
  let hits: number[] = [];
  return () => {
    const now = Date.now();
    hits = hits.filter((t) => now - t < windowMs);
    if (hits.length >= max) return false;
    hits.push(now);
    return true;
  };
}

type Ack = (result: { ok: boolean }) => void;
const ackOf = (ack: unknown): Ack => (typeof ack === "function" ? (ack as Ack) : () => {});

export function initSockets(httpServer: HttpServer) {
  const allowedOrigin = new URL(env.FRONTEND_URL).origin;

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true },
    // Wrong origins are refused before the handshake, on every transport
    allowRequest: (req, callback) => callback(null, req.headers.origin === allowedOrigin),
    maxHttpBufferSize: 10_000, // same 10kb cap as the JSON API
    connectTimeout: 10_000,
  });
  setIo(io);

  // Handshake: valid access token, active and onboarded user
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || token.length > 2048) return next(new Error("UNAUTHENTICATED"));

      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }) as jwt.JwtPayload;
      if (typeof claims.sub !== "string" || typeof claims.exp !== "number") {
        return next(new Error("UNAUTHENTICATED"));
      }

      const user = await findSocketUser(claims.sub);
      if (!user || user.status !== "active") return next(new Error("UNAUTHENTICATED"));
      if (!user.onboarded) return next(new Error("FORBIDDEN"));

      socket.data.userId = claims.sub;
      socket.data.exp = claims.exp;
      next();
    } catch {
      next(new Error("UNAUTHENTICATED")); // bad, expired or tampered: one generic answer
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);

    // Drop the socket when its token expires; the client reconnects with a fresh one
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.exp * 1000 - Date.now()));
    socket.on("disconnect", () => clearTimeout(expiry));

    const allow = makeLimiter(30, 60_000);

    // Same answer whether the conversation is missing or isn't yours
    socket.on("conversation:join", async (payload: unknown, ack?: unknown) => {
      const reply = ackOf(ack);
      try {
        const parsed = roomSchema.safeParse(payload);
        if (!allow() || !parsed.success) return reply({ ok: false });
        const rooms = [...socket.rooms].filter((r) => r.startsWith("conversation:"));
        if (rooms.length >= MAX_CONVERSATION_ROOMS) return reply({ ok: false });
        if (!(await isParticipant(parsed.data.conversationId, userId))) return reply({ ok: false });
        await socket.join(`conversation:${parsed.data.conversationId}`);
        reply({ ok: true });
      } catch (err) {
        logger.error({ event: "socket.join_failed", err });
        reply({ ok: false });
      }
    });

    socket.on("conversation:leave", (payload: unknown, ack?: unknown) => {
      const reply = ackOf(ack);
      const parsed = roomSchema.safeParse(payload);
      if (!allow() || !parsed.success) return reply({ ok: false });
      void socket.leave(`conversation:${parsed.data.conversationId}`);
      reply({ ok: true });
    });
  });

  return io;
}