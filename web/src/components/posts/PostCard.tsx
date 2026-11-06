import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Trash2, PenLine } from "lucide-react";
import Avatar from "../shared/Avatar";
import ShareMenu from "./ShareMenu";
import DeletePostModal from "./DeletePostModal";
import EditPostModal from "./EditPostModal";
import SafetyMenu from "../safety/SafetyMenu";
import { deletePost } from "../../lib/samplePosts";
import type { Post } from "../../types/posts";

export default function PostCard({ post }: Readonly<{ post: Post }>) {
  const [deleted, setDeleted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  // Local copy of body so edits show without a full re-render of the parent
  const [body, setBody] = useState(post.body);

  if (deleted) return null;

  const canShare = post.visibility === "public";
  const anonymousAndMine = post.mine === true && post.authorName === null;

  // Named authors link to their public profile. Anonymous authors never do.
  let profilePath: string | null = null;
  if (post.authorUsername) {
    profilePath = post.mine ? "/profile" : `/u/${post.authorUsername}`;
  }

  const identity = (
    <>
      <Avatar name={post.authorName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-semibold text-navy">
          {post.authorName ?? "Anonymous"}
        </p>
        <p className="text-[0.75rem] text-navy/50">{post.postedAgo}</p>
      </div>
    </>
  );

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(27,53,102,0.04)] sm:p-5">
      <header className="flex items-center gap-3">
        {profilePath ? (
          <Link
            to={profilePath}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            {identity}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
        )}

        <span className="rounded-full bg-[#efeffa] px-3 py-1 text-[0.6875rem] font-medium text-[#5a69a6]">
          {post.category}
        </span>

        {post.mine ? (
          /* Edit + Delete for own posts */
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Edit post"
              onClick={() => setEditing(true)}
              className="rounded-full p-1.5 text-navy/50 transition hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-brand-deep"
            >
              <PenLine aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Delete post"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full p-1.5 text-navy/50 transition hover:text-[#b4443a] focus-visible:outline-2 focus-visible:outline-brand-deep"
            >
              <Trash2 aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <SafetyMenu name={post.authorName} reportKind="post" />
        )}
      </header>

      <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-[1.6] text-navy/80">
        {body}
      </p>

      {anonymousAndMine ? (
        <p className="mt-2 text-[0.75rem] text-navy/50">
          Only you can see that this is yours.
        </p>
      ) : null}

      <footer className="mt-4 flex items-center justify-between gap-2">
        {post.mine ? (
          <span />
        ) : (
          <Link
            to={`/send-comfort/${post.id}`}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#eef1fa] px-4 text-[0.8125rem] font-medium text-navy transition hover:bg-[#e4e9f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            <Send aria-hidden className="h-4 w-4 text-brand-deep" strokeWidth={1.75} />
            Send comfort
          </Link>
        )}

        {canShare ? <ShareMenu postId={post.id} /> : null}
      </footer>

      {confirmingDelete && (
        <DeletePostModal
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            deletePost(post.id);
            setDeleted(true);
          }}
        />
      )}

      {editing && (
        <EditPostModal
          postId={post.id}
          initialBody={body}
          onClose={() => setEditing(false)}
          onSaved={(newBody) => setBody(newBody)}
        />
      )}
    </article>
  );
}
