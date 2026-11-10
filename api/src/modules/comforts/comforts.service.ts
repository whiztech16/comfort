import { randomUUID } from "node:crypto";
import { decryptAtRest, encryptAtRest } from "../../shared/crypto";
import { decodeCursor, encodeCursor } from "../../shared/cursor";
import { ApiError } from "../../shared/errors";
import { toPublicIdentity } from "../../shared/public-identity";
import { findVisiblePostAuthor } from "../posts/posts.repository";
import type { AppreciationInput, ComfortListQuery, CreateComfortInput } from "./comforts.validation";
import * as repo from "./comforts.repository";

const notFound = () => new ApiError(404, "NOT_FOUND", "Comfort not found");
const aad = (id: string) => `comfort:${id}`;

function toComfortDto(row: repo.ComfortRow, viewerId: string) {
  const received = row.recipientId === viewerId;
  const canRead = !received || row.openedAt !== null;

  const counterpart = received
    ? toPublicIdentity({ isAnonymous: row.isAnonymous, profile: row.senderProfile })
    : toPublicIdentity({ isAnonymous: row.postIsAnonymous ?? true, profile: row.recipientProfile });

  return {
    id: row.id,
    direction: received ? ("received" as const) : ("sent" as const),
    postId: row.postId,
    content: canRead
      ? decryptAtRest(aad(row.id), {
          ciphertext: row.contentCiphertext,
          nonce: row.contentNonce,
          keyVersion: row.keyVersion,
        })
      : null,
    counterpart,
    isOpened: row.openedAt !== null,
    appreciation: row.appreciationType ? { type: row.appreciationType, at: row.appreciatedAt } : null,
    createdAt: row.createdAt,
    ...(received ? {} : { isAnonymous: row.isAnonymous }),
  };
}

export async function sendComfort(senderId: string, input: CreateComfortInput) {
  const recipientId = await findVisiblePostAuthor(input.postId, senderId);
  if (!recipientId) throw new ApiError(404, "NOT_FOUND", "Post not found");
  if (recipientId === senderId) {
    throw new ApiError(403, "FORBIDDEN", "You can't send a Comfort to yourself");
  }

  const preference = await repo.getMessagingPreference(recipientId);
  if (!preference || preference === "off") {
    throw new ApiError(403, "FORBIDDEN", "This post isn't accepting Comforts right now");
  }

  const id = randomUUID();
  const sealed = encryptAtRest(aad(id), input.content);

  await repo.insertComfort({
    id,
    senderId,
    recipientId,
    postId: input.postId,
    contentCiphertext: sealed.ciphertext,
    contentNonce: sealed.nonce,
    keyVersion: sealed.keyVersion,
    isAnonymous: input.isAnonymous,
  });

  const row = await repo.findComfortFor(id, senderId);
  if (!row) throw new ApiError(500, "INTERNAL_ERROR", "Something went wrong");
  return toComfortDto(row, senderId);
}

export async function listComforts(userId: string, role: "received" | "sent", query: ComfortListQuery) {
  let cursor;
  if (query.cursor) {
    cursor = decodeCursor(query.cursor);
    if (!cursor) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
        { path: "cursor", message: "Invalid cursor" },
      ]);
    }
  }

  const rows = await repo.listComforts({ viewerId: userId, role, limit: query.limit, cursor });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];

  return {
    items: page.map((r) => toComfortDto(r, userId)),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.cursorTs, id: last.id }) : null,
    hasMore,
  };
}

export async function getComfort(userId: string, id: string) {
  const row = await repo.findComfortFor(id, userId);
  if (!row) throw notFound();
  return toComfortDto(row, userId);
}

export async function openComfort(userId: string, id: string) {
  const justOpened = await repo.markOpened(id, userId);
  const row = await repo.findComfortFor(id, userId);
  if (!row || row.recipientId !== userId) throw notFound();
  return { comfort: toComfortDto(row, userId), wasAlreadyOpened: !justOpened };
}

export async function appreciateComfort(userId: string, id: string, input: AppreciationInput) {
  const done = await repo.markAppreciated(id, userId, input.type);
  const row = await repo.findComfortFor(id, userId);
  if (!row || row.recipientId !== userId) throw notFound();
  if (!done) {
    throw new ApiError(
      409,
      "CONFLICT",
      row.openedAt === null ? "Open this Comfort before responding" : "You have already responded to this Comfort",
    );
  }
  return toComfortDto(row, userId);
}