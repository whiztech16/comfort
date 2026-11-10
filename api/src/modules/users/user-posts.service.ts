import { ApiError } from "../../shared/errors";
import { getAuthorPosts } from "../posts/posts.service";
import { findPublicProfile } from "./users.repository";

type PageQuery = { limit: number; cursor?: string };

export async function getPublicUserPosts(viewerId: string, username: string, query: PageQuery) {
  const target = await findPublicProfile(username, viewerId);
  if (!target || (target.userId !== viewerId && !target.discoverable)) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }
  return getAuthorPosts({ viewerId, authorId: target.userId, query, excludeAnonymous: true });
}

export const getMyPosts = (viewerId: string, query: PageQuery) =>
  getAuthorPosts({ viewerId, authorId: viewerId, query, excludeAnonymous: false });