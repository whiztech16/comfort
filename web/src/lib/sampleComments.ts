import type { Comment } from "../types/comment";

export const sampleComments: Record<string, Comment[]> = {
  p2: [
    {
      id: "c1",
      authorName: "Zoe",
      postedAgo: "3h ago",
      body: "So proud of you for taking that step. 💙",
      replies: [
        {
          id: "c1r1",
          authorName: "Maya",
          postedAgo: "2h ago",
          body: "Thank you, Zoe. That means a lot.",
        },
      ],
    },
    {
      id: "c2",
      authorName: "Ruby",
      postedAgo: "1h ago",
      body: "Small steps really do add up. Keep going.",
      replies: [],
    },
  ],
  p3: [
    {
      id: "c3",
      authorName: "Ava",
      postedAgo: "5h ago",
      body: "Thank you for sharing this. I needed it today.",
      replies: [],
    },
    {
      id: "c4",
      authorName: "Fortune",
      postedAgo: "4h ago",
      body: "Amen. 🙏",
      mine: true,
      replies: [],
    },
  ],
};