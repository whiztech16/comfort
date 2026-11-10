import { apiRequest } from "./api";
import type { Appreciation, Comfort, ReceivedComfort, SentComfort } from "../types/messaging";

const toBackendAppreciation = (type: Appreciation): "this_helped" | "made_my_day" | "thank_you" => {
  switch (type) {
    case "This helped":
      return "this_helped";
    case "Made my day":
      return "made_my_day";
    case "Thank you":
      return "thank_you";
  }
};

const toFrontendAppreciation = (type: string | null | undefined): Appreciation | null => {
  switch (type) {
    case "this_helped":
      return "This helped";
    case "made_my_day":
      return "Made my day";
    case "thank_you":
      return "Thank you";
    default:
      return null;
  }
};

export function formatApiComfort(c: any): Comfort {
  const isReceived = c.direction === "received";
  const sentAt = c.createdAt
    ? new Date(c.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Recently";

  const appreciation = toFrontendAppreciation(c.appreciation?.type);

  if (isReceived) {
    return {
      id: c.id,
      direction: "received",
      from: {
        displayName: c.counterpart?.displayName ?? null,
        isAnonymous: c.counterpart?.isAnonymous ?? false,
      },
      body: c.content || "",
      sentAt,
      firstOpenedAt: c.isOpened ? (c.openedAt || c.createdAt) : null,
      appreciation,
      conversationId: null,
    } as ReceivedComfort;
  }

  return {
    id: c.id,
    direction: "sent",
    to: {
      displayName: c.counterpart?.displayName ?? null,
      isAnonymous: c.counterpart?.isAnonymous ?? false,
    },
    body: c.content || "",
    sentAt,
    status: c.isOpened ? "opened" : "delivered",
    appreciation,
  } as SentComfort;
}

export async function sendComfortApi(postId: string, content: string, isAnonymous: boolean) {
  const res = await apiRequest<{ comfort: any }>("/api/v1/comforts", {
    method: "POST",
    body: JSON.stringify({ postId, content, isAnonymous }),
  });
  return res.data?.comfort;
}

export async function listReceivedComfortsApi(limit = 20, cursor?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequest<{ items: any[]; nextCursor: string | null; hasMore: boolean }>(
    `/api/v1/comforts/received${query}`
  );
  return {
    items: (res.data?.items || []).map(formatApiComfort) as ReceivedComfort[],
    nextCursor: res.data?.nextCursor || null,
    hasMore: Boolean(res.data?.hasMore),
  };
}

export async function listSentComfortsApi(limit = 20, cursor?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequest<{ items: any[]; nextCursor: string | null; hasMore: boolean }>(
    `/api/v1/comforts/sent${query}`
  );
  return {
    items: (res.data?.items || []).map(formatApiComfort) as SentComfort[],
    nextCursor: res.data?.nextCursor || null,
    hasMore: Boolean(res.data?.hasMore),
  };
}

export async function getComfortApi(id: string): Promise<Comfort> {
  const res = await apiRequest<{ comfort: any }>(`/api/v1/comforts/${id}`);
  return formatApiComfort(res.data?.comfort);
}

export async function openComfortApi(id: string): Promise<Comfort> {
  const res = await apiRequest<{ comfort: any }>(`/api/v1/comforts/${id}/open`, {
    method: "POST",
  });
  return formatApiComfort(res.data?.comfort);
}

export async function appreciateComfortApi(id: string, appreciation: Appreciation): Promise<Comfort> {
  const backendType = toBackendAppreciation(appreciation);
  const res = await apiRequest<{ comfort: any }>(`/api/v1/comforts/${id}/appreciation`, {
    method: "POST",
    body: JSON.stringify({ type: backendType }),
  });
  return formatApiComfort(res.data?.comfort);
}

