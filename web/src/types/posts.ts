export type PostCategory = "Encouragement" | "Faith" | "Wellness";

export interface Post {
  id: string;
  authorName: string | null; // null when posted anonymously
  postedAgo: string;
  category: PostCategory;
  body: string;
}