import { decodeCursor, encodeCursor } from "../../shared/cursor";
import { ApiError } from "../../shared/errors";
import { toPublicIdentity } from "../../shared/public-identity";
import { emitToUser } from "../../sockets/emitter";
import { notify } from "../notifications/notifications.service";
import type { PageQuery, SendMessageInput } from "./conversations.validation";
import * as repo from "./conversations.repository";

const notFound = () => new ApiError(404, "NOT_FOUND", "Conversation not found");

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function badCursor() {
  return new ApiError(422, "VALIDATION_ERROR", "Invalid request", [{ path: "cursor", message: "Invalid cursor" }]);
}

// Explicit fields only: no user IDs ever leave this function
function toConversationDto(row: repo.ConversationRow) {
  // Anonymity follows the originating Comfort (or the post, for the sender's view)
  const counterpartIsSender = row.comfortSenderId === row.counterpartId;
  const isAnonymous = counterpartIsSender ? row.comfortIsAnonymous : (row.postIsAnonymous ?? true);
  return {
    id: row.id,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
    counterpart: toPublicIdentity({ isAnonymous, profile: row.counterpartProfile }),
    counterpartPublicKey: row.counterpartPublicKey,
    locked: row.blocked || row.counterpartStatus !== "active",
    hasUnread: row.hasUnread,
  };
}

type MessageRow = {
  id: string;
  ciphertext: string;
  nonce: string;
  senderWrappedKey: string;
  recipientWrappedKey: string;
  createdAt: Date;
};

const toMessageDto = (m: MessageRow, isMine: boolean) => ({
  id: m.id,
  ciphertext: m.ciphertext,
  nonce: m.nonce,
  senderWrappedKey: m.senderWrappedKey,
  recipientWrappedKey: m.recipientWrappedKey,
  isMine,
  createdAt: m.createdAt,
});

export async function createConversation(userId: string, comfortId: string) {
  const c = await repo.findComfortForConversation(comfortId, userId);
  // Missing, not yours, blocked, or sender gone: all look the same
  if (!c || c.blocked || c.senderStatus !== "active") {
    throw new ApiError(404, "NOT_FOUND", "Comfort not found");
  }
  if (!c.openedAt) throw new ApiError(409, "CONFLICT", "Open this Comfort before starting a conversation");
  if (!c.senderHasKey || !c.recipientHasKey) {
    throw new ApiError(409, "CONFLICT", "Encryption isn't ready for this conversation yet");
  }

  let id: string;
  try {
    id = await repo.insertConversation(comfortId, c.senderId, userId);
  } catch (err) {
    // The unique index on source_comfort_id decides the race (R6)
    if (isUniqueViolation(err)) throw new ApiError(409, "CONFLICT", "A conversation already exists for this Comfort");
    throw err;
  }

  const row = await repo.findConversationFor(id, userId);
  if (!row) throw new ApiError(500, "INTERNAL_ERROR", "Something went wrong");

  // Both lists update live; each side gets a view built from their own position
  const mine = toConversationDto(row);
  emitToUser(userId, "conversation:updated", { conversation: mine });
  const theirs = await repo.findConversationFor(id, c.senderId);
  if (theirs) emitToUser(c.senderId, "conversation:updated", { conversation: toConversationDto(theirs) });
  return mine;
}

export async function listConversations(userId: string, query: PageQuery) {
  let cursor;
  if (query.cursor) {
    cursor = decodeCursor(query.cursor);
    if (!cursor) throw badCursor();
  }
  const rows = await repo.listConversations({ viewerId: userId, limit: query.limit, cursor });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];
  return {
    items: page.map(toConversationDto),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.sortTs, id: last.id }) : null,
    hasMore,
  };
}

export async function getConversation(userId: string, id: string) {
  const row = await repo.findConversationFor(id, userId);
  if (!row) throw notFound();
  return toConversationDto(row);
}

export async function listMessages(userId: string, id: string, query: PageQuery) {
  // Participant check first; history stays readable even when locked
  if (!(await repo.findConversationFor(id, userId))) throw notFound();

  let cursor;
  if (query.cursor) {
    cursor = decodeCursor(query.cursor);
    if (!cursor) throw badCursor();
  }
  const rows = await repo.listMessages({ conversationId: id, viewerId: userId, limit: query.limit, cursor });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];
  return {
    items: page.map((m) => toMessageDto(m, m.isMine)),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.cursorTs, id: last.id }) : null,
    hasMore,
  };
}

export async function sendMessage(userId: string, id: string, input: SendMessageInput) {
  const row = await repo.findConversationFor(id, userId);
  if (!row) throw notFound();
  if (row.blocked) throw new ApiError(403, "BLOCKED", "You can't send messages in this conversation");
  if (row.counterpartStatus !== "active") throw new ApiError(403, "FORBIDDEN", "This conversation is unavailable");
  if (!row.myKeyReady || !row.counterpartPublicKey) {
    throw new ApiError(409, "CONFLICT", "Encryption isn't ready for this conversation");
  }

  const msg = await repo.createMessage(id, userId, input);
  await notify(row.counterpartId, "new_message", "conversation", id);

  // Each side gets the encrypted envelope with its own isMine flag
  const mine = toMessageDto(msg, true);
  emitToUser(userId, "message:new", { conversationId: id, message: mine });
  emitToUser(row.counterpartId, "message:new", { conversationId: id, message: toMessageDto(msg, false) });
  return mine;
}

export async function markRead(userId: string, id: string) {
  const row = await repo.findConversationFor(id, userId);
  if (!row) throw notFound();
  const readAt = await repo.markRead(id, userId);
  if (!readAt) throw notFound();

  // The other person sees the receipt; the reader's other devices clear their badge
  emitToUser(row.counterpartId, "message:read", { conversationId: id, readAt });
  const fresh = await repo.findConversationFor(id, userId);
  if (fresh) emitToUser(userId, "conversation:updated", { conversation: toConversationDto(fresh) });
  return { readAt };
}