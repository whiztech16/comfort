import { apiRequest } from "./api";

export type NotificationType = "new_comfort" | "new_message" | "new_appreciation";

export interface ApiNotification {
  id: string;
  type: NotificationType;
  entityType: "comfort" | "conversation";
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES: ReadonlySet<string> = new Set(["new_comfort", "new_message", "new_appreciation"]);
const ENTITIES: ReadonlySet<string> = new Set(["comfort", "conversation"]);

export function isNotification(value: unknown): value is ApiNotification {
  if (typeof value !== "object" || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.id === "string" &&
    UUID_RE.test(n.id) &&
    typeof n.type === "string" &&
    TYPES.has(n.type) &&
    typeof n.entityType === "string" &&
    ENTITIES.has(n.entityType) &&
    typeof n.entityId === "string" &&
    UUID_RE.test(n.entityId) &&
    typeof n.isRead === "boolean" &&
    typeof n.createdAt === "string"
  );
}

export function notificationPath(n: ApiNotification): string {
  return n.entityType === "conversation"
    ? `/comforts/conversations/${n.entityId}`
    : `/comforts/${n.entityId}`;
}

export async function listNotificationsApi(limit = 20): Promise<ApiNotification[]> {
  const res = await apiRequest<{ items: unknown[] }>(`/api/v1/notifications?limit=${limit}`);
  return (res.data?.items ?? []).filter(isNotification);
}

export async function unreadCountApi(): Promise<number> {
  const res = await apiRequest<{ count: number }>("/api/v1/notifications/unread-count");
  const count = res.data?.count;
  return typeof count === "number" && count >= 0 ? count : 0;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await apiRequest(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiRequest("/api/v1/notifications/read-all", { method: "POST" });
}