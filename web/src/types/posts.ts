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
  authorName: string | null; // null when posted anonymously
  authorUsername: string | null; // null when posted anonymously
  mine?: boolean; // true only for the logged-in person's own posts
  postedAgo: string;
  category: PostCategory;
  body: string;
  visibility: "public" | "private"; // private posts cannot be shared
}