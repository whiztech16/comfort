import type { Post } from "../types/posts";

export const samplePosts: Post[] = [
  {
    id: "p1",
    authorName: null,
    postedAgo: "2h ago",
    category: "Encouragement",
    body: "You are doing better than you think.\nEven on the hard days, you’re still showing up — and that is something to be proud of.\nKeep going. You’ve got this. 💙",
  },
  {
    id: "p2",
    authorName: "Maya",
    postedAgo: "4h ago",
    category: "Wellness",
    body: "I finally took that step I’ve been overthinking for weeks. It was scary, but it was worth it.\nSmall steps really do lead to big changes. 💙",
  },
  {
    id: "p3",
    authorName: "Jay",
    postedAgo: "6h ago",
    category: "Faith",
    body: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.\n— Psalm 34:18",
  },
];