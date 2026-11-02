export const postCategories = [
  "Encouragement",
  "Personal Experiences",
  "Everyday Thoughts",
  "Faith and Scripture",
  "Prayers",
  "Affirmations",
  "General Kindness",
] as const;

export type PostCategory = (typeof postCategories)[number];

export interface Post {
  id: string;
  authorName: string | null; // null when posted anonymously
  postedAgo: string;
  category: PostCategory;
  body: string;
  visibility: "public" | "private"; // private posts cannot be shared
  commentsEnabled: boolean; // chosen by the author
  likeCount: number; // starting like count shown on the card
}
