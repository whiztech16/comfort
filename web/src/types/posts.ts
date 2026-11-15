export const postCategories = [
  "Encouragement",
  "Personal Experiences",
  "Everyday Thoughts",
  "Faith and Scripture",
  "Prayers",
  "Affirmations",
  "Kindness",
] as const;

export type PostCategory = (typeof postCategories)[number];

export interface Post {
  id: string;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatarUrl?: string | null;
  mine?: boolean;
  postedAgo: string;
  category: PostCategory;
  body: string;
  visibility: "public" | "private";
}