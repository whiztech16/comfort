import { ApiError } from "../../shared/errors";
import { decodeCursor, encodeCursor } from "../../shared/cursor";
import { toPublicIdentity } from "../../shared/public-identity";
import type { CreatePostInput, FeedQuery } from "./posts.validation";
import * as repo from "./posts.repository";

const notFound = () => new ApiError(404, "NOT_FOUND", "Post not found");

function toPostDto(row: repo.PostRow) {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    isMine: row.isMine,
    category: row.category,
    author: toPublicIdentity({ isAnonymous: row.isAnonymous, profile: row.profile }),
  };
}

export async function createPost(userId: string, input: CreatePostInput) {
  const category = await repo.findCategoryById(input.categoryId);
  if (!category) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
      { path: "categoryId", message: "Unknown category" },
    ]);
  }
  const id = await repo.insertPost(userId, input);
  const row = await repo.findVisiblePost(id, userId);
  if (!row) throw new ApiError(500, "INTERNAL_ERROR", "Something went wrong");
  return toPostDto(row);
}

export async function getFeed(userId: string, query: FeedQuery) {
  let cursor;
  if (query.cursor) {
    cursor = decodeCursor(query.cursor);
    if (!cursor) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
        { path: "cursor", message: "Invalid cursor" },
      ]);
    }
  }

  const rows = await repo.listFeed({
    viewerId: userId,
    limit: query.limit,
    categorySlug: query.category,
    cursor,
  });

  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(toPostDto),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.cursorTs, id: last.id }) : null,
    hasMore,
  };
}

export async function getPost(userId: string, id: string) {
  const row = await repo.findVisiblePost(id, userId);
  if (!row) throw notFound();
  return toPostDto(row);
}

export async function deletePost(userId: string, id: string) {
  const deleted = await repo.softDeleteOwnPost(id, userId);
  if (!deleted) throw notFound();
}
export async function getAuthorPosts(opts: {
  viewerId: string;
  authorId: string;
  query: { limit: number; cursor?: string };
  excludeAnonymous: boolean;
}) {
  let cursor;
  if (opts.query.cursor) {
    cursor = decodeCursor(opts.query.cursor);
    if (!cursor) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
        { path: "cursor", message: "Invalid cursor" },
      ]);
    }
  }

  const rows = await repo.listByAuthor({
    viewerId: opts.viewerId,
    authorId: opts.authorId,
    limit: opts.query.limit,
    cursor,
    excludeAnonymous: opts.excludeAnonymous,
  });

  const hasMore = rows.length > opts.query.limit;
  const page = rows.slice(0, opts.query.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(toPostDto),
    nextCursor: hasMore && last ? encodeCursor({ ts: last.cursorTs, id: last.id }) : null,
    hasMore,
  };
}