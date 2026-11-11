import type { Server } from "socket.io";

// The server-to-client events from PRD section 13.4
export type ServerEvent =
  | "comfort:new"
  | "notification:new"
  | "message:new"
  | "message:read"
  | "conversation:updated"
  | "keys:link-approved";

let io: Server | null = null;

export const setIo = (server: Server) => {
  io = server;
};

export function emitToUser(userId: string, event: ServerEvent, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

// Drops every socket a user has open (used on account deletion)
export function disconnectUser(userId: string) {
  io?.in(`user:${userId}`).disconnectSockets(true);
}