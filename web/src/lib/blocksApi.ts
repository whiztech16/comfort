import { apiRequest } from "./api";

export interface ApiBlock {
  id: string;
  user: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    isAnonymous: boolean;
  };
  createdAt: string;
}

export async function listBlocksApi(): Promise<ApiBlock[]> {
  const res = await apiRequest<{ items: ApiBlock[] }>("/api/v1/blocks");
  return res.data?.items ?? [];
}

export async function unblockApi(blockId: string): Promise<void> {
  await apiRequest(`/api/v1/blocks/${blockId}`, { method: "DELETE" });
}

export async function blockByUsernameApi(username: string): Promise<void> {
  await apiRequest("/api/v1/blocks", { method: "POST", body: JSON.stringify({ username }) });
}

export async function blockComfortSenderApi(comfortId: string): Promise<void> {
  await apiRequest(`/api/v1/comforts/${comfortId}/block`, { method: "POST" });
}

export async function blockConversationApi(conversationId: string): Promise<void> {
  await apiRequest(`/api/v1/blocks/conversation/${conversationId}`, { method: "POST" });
}

export async function unblockConversationApi(conversationId: string): Promise<void> {
  await apiRequest(`/api/v1/blocks/conversation/${conversationId}`, { method: "DELETE" });
}