export interface CommentBase {
  id: string;
  authorName: string;
  postedAgo: string;
  body: string;
  mine?: boolean; // temporary: true when the logged-in person wrote it
}

export interface Comment extends CommentBase {
  replies: CommentBase[]; // one level of replies only
}