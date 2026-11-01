import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Ellipsis, Send } from "lucide-react";
import Avatar from "../shared/Avatar";
import type { Post } from "../../types/posts";

export default function PostCard({ post }: { post: Post }) {
  const [saved, setSaved] = useState(false);

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

      <footer className="mt-4 flex items-center justify-between">
        <Link
          to={`/send-comfort/${post.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#eef1fa] px-4 text-[0.8125rem] font-medium text-navy transition hover:bg-[#e4e9f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <Send aria-hidden className="h-4 w-4 text-brand-deep" strokeWidth={1.75} />
          Send comfort
        </Link>

        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save post"}
          onClick={() => setSaved((value) => !value)}
          className="rounded-full p-2 text-navy/45 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
        >
          <Bookmark
            aria-hidden
            className={`h-5 w-5 ${saved ? "fill-brand-deep text-brand-deep" : ""}`}
            strokeWidth={1.75}
          />
        </button>
      </footer>
    </article>
  );
}