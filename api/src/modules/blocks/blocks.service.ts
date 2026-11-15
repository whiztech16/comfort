import { ApiError } from "../../shared/errors";
import { toPublicIdentity } from "../../shared/public-identity";
import * as repo from "./blocks.repository";

export async function blockByUsername(blockerId: string, username: string) {
  const target = await repo.findBlockableUser(username);
  if (target && target.userId === blockerId) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
      { path: "username", message: "You can't block yourself" },
    ]);
  }
  if (!target || !target.discoverable) throw new ApiError(404, "NOT_FOUND", "User not found");
  await repo.insertBlock(blockerId, target.userId, false);
}

export async function blockComfortSender(blockerId: string, comfortId: string) {
  const comfort = await repo.findReceivedComfortSender(comfortId, blockerId);
  if (!comfort) throw new ApiError(404, "NOT_FOUND", "Comfort not found");
  await repo.insertBlock(blockerId, comfort.senderId, comfort.isAnonymous);
}

async function requireCounterpart(viewerId: string, conversationId: string) {
  const c = await repo.findConversationCounterpart(conversationId, viewerId);
  if (!c) throw new ApiError(404, "NOT_FOUND", "Conversation not found");
  return c;
}

export async function blockConversationCounterpart(blockerId: string, conversationId: string) {
  const c = await requireCounterpart(blockerId, conversationId);
  // Same anonymity rule the conversation itself uses
  const counterpartIsSender = c.comfortSenderId === c.counterpartId;
  const isAnonymous = counterpartIsSender ? c.comfortIsAnonymous : (c.postIsAnonymous ?? true);
  await repo.insertBlock(blockerId, c.counterpartId, isAnonymous);
}

export async function unblockConversationCounterpart(blockerId: string, conversationId: string) {
  const c = await requireCounterpart(blockerId, conversationId);
  await repo.deleteBlockBetween(blockerId, c.counterpartId);
}

export async function listBlocks(blockerId: string) {
  const rows = await repo.listBlocks(blockerId);
  return rows.map((b) => ({
    id: b.id,
    user: toPublicIdentity({ isAnonymous: b.isAnonymous, profile: b.profile }),
    createdAt: b.createdAt,
  }));
}

export async function unblock(blockerId: string, id: string) {
  if (!(await repo.deleteBlock(id, blockerId))) throw new ApiError(404, "NOT_FOUND", "Block not found");
}