import { useState } from "react";
import { Bookmark, Ellipsis, Heart, MessageCircle } from "lucide-react";
import Avatar from "../shared/Avatar";
import ShareMenu from "./ShareMenu";
import CommentThread from "./CommentThread";
import { actionButton } from "./actionStyles";
import { sampleComments } from "../../lib/sampleComments";
import type { Post } from "../../types/posts";

export default function PostCard({ post }: Readonly<{ post: Post }>) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const canShare = post.visibility === "public";
  const commentsId = `comments-${post.id}`;

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    // TODO: when backend is ready — POST /api/posts/:id/like
    // The server will create a notification for the post author so they
    // see "Fortune liked your post" in their Notifications screen.
  }

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(27,53,102,0.04)] sm:p-5">
      <header className="flex items-center gap-3">
        <Avatar name={post.authorName} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-navy">
            {post.authorName ?? "Anonymous"}
          </p>
          <p className="text-[0.75rem] text-navy/50">{post.postedAgo}</p>
        </div>

        <span className="rounded-full bg-[#efeffa] px-3 py-1 text-[0.6875rem] font-medium text-[#5a69a6]">
          {post.category}
        </span>

        <button
          type="button"
          aria-label="More options"
          className="rounded-full p-1.5 text-navy/50 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
        >
          <Ellipsis aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-[1.6] text-navy/80">
        {post.body}
      </p>

      <footer className="mt-4 flex items-center justify-between gap-2">
        {/* Heart / Like button — like count visible to everyone */}
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Unlike post" : "Like post"}
          onClick={handleLike}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#fff0f3] px-4 text-[0.8125rem] font-medium text-[#b4443a] transition hover:bg-[#fde4e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4443a]"
        >
          <Heart
            aria-hidden
            className={`h-4 w-4 transition-transform ${liked ? "fill-[#b4443a] scale-110" : ""}`}
            strokeWidth={1.75}
          />
          <span>{likeCount}</span>
        </button>

        <div className="flex items-center">
          {post.commentsEnabled ? (
            <button
              type="button"
              aria-expanded={showComments}
              aria-controls={commentsId}
              aria-label={showComments ? "Hide comments" : "Show comments"}
              onClick={() => setShowComments((v) => !v)}
              className={`${actionButton} ${showComments ? "bg-[#f1f3fa] text-navy" : ""}`}
            >
              <MessageCircle aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Comment</span>
            </button>
          ) : null}

          {canShare ? <ShareMenu postId={post.id} /> : null}

          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save post"}
            onClick={() => setSaved((v) => !v)}
            className={actionButton}
          >
            <Bookmark
              aria-hidden
              className={`h-[18px] w-[18px] ${saved ? "fill-brand-deep text-brand-deep" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </footer>

      {showComments ? (
        <div id={commentsId} className="mt-4 border-t border-black/[0.06] pt-4">
          <CommentThread initial={sampleComments[post.id] ?? []} />
        </div>
      ) : null}
    </article>
  );
}
