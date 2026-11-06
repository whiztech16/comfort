import type { Post } from "../types/posts";

export const samplePosts: Post[] = [
  {
    id: "p1",
    authorName: null,
    authorUsername: null,
    mine: true,
    postedAgo: "2h ago",
    category: "Encouragement",
    body: "You are doing better than you think.\nEven on the hard days, you’re still showing up — and that is something to be proud of.\nKeep going. You’ve got this. 💙",
    visibility: "public",
  },
  {
    id: "p2",
    authorName: "Maya",
    authorUsername: "maya",
    postedAgo: "4h ago",
    category: "Personal Experiences",
    body: "I finally took that step I’ve been overthinking for weeks. It was scary, but it was worth it.\nSmall steps really do lead to big changes. 💙",
    visibility: "public",
  },
  {
    id: "p3",
    authorName: "Jay",
    authorUsername: "jay",
    postedAgo: "6h ago",
    category: "Faith and Scripture",
    body: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.\n— Psalm 34:18",
    visibility: "public",
  },
  {
    id: "p4",
    authorName: "Fortune",
    authorUsername: "fortune",
    mine: true,
    postedAgo: "1d ago",
    category: "Everyday Thoughts",
    body: "Grateful for small wins today. A quiet morning and a good conversation were enough.",
    visibility: "public",
  },
  {
    id: "p5",
    authorName: "Zoe",
    authorUsername: "zoe",
    postedAgo: "1d ago",
    category: "Prayers",
    body: "Praying for anyone who is carrying something heavy tonight. You are not alone.",
    visibility: "public",
  },
];

// Private posts are kept apart: they never appear in the feed or at a public link
export const privatePosts: Post[] = [];

// Only public posts can be opened through a link
export function getPost(id: string) {
  return samplePosts.find((post) => post.id === id);
}

// Named public posts by one person. Anonymous posts never appear here.
export function postsByAuthor(username: string) {
  return samplePosts.filter((post) => post.authorUsername === username);
}

// The logged-in person's own posts, including the anonymous ones (only they can see that)
export function myPosts() {
  return [...samplePosts, ...privatePosts].filter((post) => post.mine);
}

// Temporary stand-in for the backend. Changes last until the page is refreshed.
export function addSamplePost(post: Post) {
  if (post.visibility === "public") {
    samplePosts.unshift(post);
  } else {
    privatePosts.unshift(post);
  }
}

export function deletePost(id: string) {
  for (const list of [samplePosts, privatePosts]) {
    const index = list.findIndex((post) => post.id === id);
    if (index !== -1) list.splice(index, 1);
  }
}

export function editPost(id: string, body: string) {
  for (const list of [samplePosts, privatePosts]) {
    const post = list.find((p) => p.id === id);
    if (post) {
      post.body = body;
      return;
    }
  }
}