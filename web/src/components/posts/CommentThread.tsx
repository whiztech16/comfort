import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import Avatar from "../shared/Avatar";
import type { Comment, CommentBase } from "../../types/comment";

// Temporary: the logged-in person's name will come from their account
const currentUserName = "Fortune";

const textAction =
  "text-[0.75rem] font-medium text-navy/55 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep";

type ComposerProps = Readonly<{
  label: string;
  placeholder: string;
  onSubmit: (body: string) => void;
  focusOnMount?: boolean;
}>;

function Composer({
  label,
  placeholder,
  onSubmit,
  focusOnMount = false,
}: ComposerProps) {
  const [text, setText] = useState("");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus();
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    onSubmit(body);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 min-w-0 flex-1 rounded-full bg-[#f1f3fa] px-4 text-[0.875rem] text-navy outline-none placeholder:text-navy/45 focus:ring-2 focus:ring-brand/40"
      />
      <button
        type="submit"
        aria-label="Post"
        disabled={!text.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:brightness-105 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <Send aria-hidden className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  );
}

type RowProps = Readonly<{
  comment: CommentBase;
  reported: boolean;
  onReply?: () => void;
  onReport: () => void;
  onDelete: () => void;
}>;

function CommentRow({ comment, reported, onReply, onReport, onDelete }: RowProps) {
  let ownerAction;
  if (comment.mine) {
    ownerAction = (
      <button type="button" onClick={onDelete} className={textAction}>
        Delete
      </button>
    );
  } else if (reported) {
    ownerAction = (
      <span className="text-[0.75rem] text-navy/50">Reported. Thank you.</span>
    );
  } else {
    ownerAction = (
      <button type="button" onClick={onReport} className={textAction}>
        Report
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar name={comment.authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem]">
          <span className="font-semibold text-navy">{comment.authorName}</span>{" "}
          <span className="text-navy/50">· {comment.postedAgo}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-line text-[0.875rem] leading-[1.55] text-navy/80">
          {comment.body}
        </p>
        <div className="mt-1.5 flex items-center gap-4">
          {onReply ? (
            <button type="button" onClick={onReply} className={textAction}>
              Reply
            </button>
          ) : null}
          {ownerAction}
        </div>
      </div>
    </div>
  );
}

export default function CommentThread({
  initial,
}: Readonly<{ initial: Comment[] }>) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reported, setReported] = useState<ReadonlySet<string>>(new Set());

  function addComment(body: string) {
    setComments((previous) => [
      ...previous,
      {
        id: `c-${Date.now()}`,
        authorName: currentUserName,
        postedAgo: "Just now",
        body,
        mine: true,
        replies: [],
      },
    ]);
  }

  function addReply(parentId: string, body: string) {
    setComments((previous) =>
      previous.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: `r-${Date.now()}`,
                  authorName: currentUserName,
                  postedAgo: "Just now",
                  body,
                  mine: true,
                },
              ],
            }
          : comment
      )
    );
    setReplyingTo(null);
  }

  function remove(id: string) {
    setComments((previous) =>
      previous
        .filter((comment) => comment.id !== id)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== id),
        }))
    );
  }

  // Later: open a report form with reasons and send it to the backend
  function report(id: string) {
    setReported((previous) => new Set(previous).add(id));
  }

  return (
    <section aria-label="Comments" className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-[0.875rem] text-navy/60">
          No comments yet. Be the first to say something kind.
        </p>
      ) : null}

      {comments.map((comment) => (
        <div key={comment.id} className="space-y-3">
          <CommentRow
            comment={comment}
            reported={reported.has(comment.id)}
            onReply={() => setReplyingTo(comment.id)}
            onReport={() => report(comment.id)}
            onDelete={() => remove(comment.id)}
          />

          {comment.replies.length > 0 ? (
            <div className="ml-4 space-y-3 border-l border-black/[0.06] pl-4">
              {comment.replies.map((reply) => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  reported={reported.has(reply.id)}
                  onReport={() => report(reply.id)}
                  onDelete={() => remove(reply.id)}
                />
              ))}
            </div>
          ) : null}

          {replyingTo === comment.id ? (
            <div className="ml-4 pl-4">
              <Composer
                label={`Reply to ${comment.authorName}`}
                placeholder={`Reply to ${comment.authorName}…`}
                onSubmit={(body) => addReply(comment.id, body)}
                focusOnMount
              />
            </div>
          ) : null}
        </div>
      ))}

      <Composer
        label="Write a comment"
        placeholder="Write something kind…"
        onSubmit={addComment}
      />
    </section>
  );
}