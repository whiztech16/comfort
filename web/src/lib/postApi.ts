import type { Post } from "../types/posts";

export type ApiPost = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  visibility: "public" | "private";
  category: { id: string; name: string; slug: string };
  author: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    isAnonymous: boolean;
  };
};

// "Just now", "5m ago", "3h ago", "2d ago", then a date
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatApiPost(p: ApiPost): Post {
  // Anonymous authors never carry a name or username, not even for their own posts
  const anonymous = p.author.isAnonymous;
  return {
    id: p.id,
    body: p.content,
    authorName: anonymous ? null : p.author.displayName,
    authorUsername: anonymous ? null : p.author.username,
    category: p.category.name,
    postedAgo: timeAgo(p.createdAt),
    mine: p.isMine,
    visibility: p.visibility,
  } as Post;
}