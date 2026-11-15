import { apiRequest } from "./api";
import type { ConversationSummary } from "../types/messaging";

export interface ApiIdentity {
  displayName: string | null;
  isAnonymous: boolean;
  username?: string | null;
  avatarUrl?: string | null;
}

export interface ApiConversation {
  id: string;
  createdAt: string;
  lastMessageAt: string | null;
  counterpart: ApiIdentity;
  counterpartPublicKey: string | null;
  locked: boolean;
  blockedByMe?: boolean;
  hasUnread: boolean;
}

export interface ApiMessage {
  id: string;
  ciphertext: string;
  nonce: string;
  senderWrappedKey: string;
  recipientWrappedKey: string;
  createdAt: string;
  isMine: boolean;
}

export interface SealedMessage {
  ciphertext: string;
  nonce: string;
  senderWrappedKey: string;
  recipientWrappedKey: string;
}

type Page<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };

function pageQuery(limit: number, cursor?: string): string {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function toPerson(identity: ApiIdentity | null | undefined) {
  return {
    displayName: identity?.displayName ?? null,
    isAnonymous: identity?.isAnonymous ?? false,
  };
}

export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export async function listConversationsApi(limit = 20, cursor?: string): Promise<Page<ApiConversation>> {
  const res = await apiRequest<Page<ApiConversation>>(`/api/v1/conversations${pageQuery(limit, cursor)}`);
  return {
    items: res.data?.items ?? [],
    nextCursor: res.data?.nextCursor ?? null,
    hasMore: Boolean(res.data?.hasMore),
  };
}

export async function getConversationApi(id: string): Promise<ApiConversation> {
  const res = await apiRequest<{ conversation: ApiConversation }>(`/api/v1/conversations/${id}`);
  if (!res.data?.conversation) throw new Error("Conversation not found in response");
  return res.data.conversation;
}

export async function createConversationApi(comfortId: string): Promise<ApiConversation> {
  const res = await apiRequest<{ conversation: ApiConversation }>("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify({ comfortId }),
  });
  if (!res.data?.conversation) throw new Error("Conversation not found in response");
  return res.data.conversation;
}

export async function listMessagesApi(
  conversationId: string,
  limit = 30,
  cursor?: string,
): Promise<Page<ApiMessage>> {
  const res = await apiRequest<Page<ApiMessage>>(
    `/api/v1/conversations/${conversationId}/messages${pageQuery(limit, cursor)}`,
  );
  return {
    items: res.data?.items ?? [],
    nextCursor: res.data?.nextCursor ?? null,
    hasMore: Boolean(res.data?.hasMore),
  };
}

export async function sendMessageApi(conversationId: string, sealed: SealedMessage): Promise<ApiMessage> {
  const res = await apiRequest<{ message: ApiMessage }>(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(sealed),
  });
  if (!res.data?.message) throw new Error("Message not found in response");
  return res.data.message;
}

export async function markReadApi(conversationId: string): Promise<void> {
  await apiRequest(`/api/v1/conversations/${conversationId}/read`, { method: "POST" });
}






export function toConversationSummary(c: ApiConversation): ConversationSummary {
  return {
    id: c.id,
    participant: toPerson(c.counterpart),
    unread: c.hasUnread,
    lastActivity: formatChatTime(c.lastMessageAt ?? c.createdAt),
    hasMessages: c.lastMessageAt !== null,
    locked: c.locked,
  };
}