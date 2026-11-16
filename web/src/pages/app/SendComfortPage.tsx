import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX, Loader2 } from "lucide-react";
import SendingAnimation from "../../components/messaging/SendingAnimation";
import Segmented from "../../components/shared/Segmented";
import Avatar from "../../components/shared/Avatar";
import { EmptyState } from "../../components/shared/States";
import { PrimaryButton, PrimaryLink } from "../../components/shared/PrimaryButton";
import { apiRequest, getUser } from "../../lib/api";
import { sendComfortApi } from "../../lib/comfortsApi";
import { formatApiPost } from "../../lib/postApi";
import type { ApiPost } from "../../lib/postApi";
import type { Person } from "../../types/messaging";
import type { Post } from "../../types/posts";

type Identity = "named" | "anonymous";
type Phase = "idle" | "sending" | "sent";

const isIdentity = (v: string): v is Identity => v === "named" || v === "anonymous";

const MAX_LENGTH = 2000;
const MIN_SENDING_MS = 1400;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function friendlyError(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  if (e.status === 429) return "You've sent a lot of Comforts recently. Please try again later.";
  if (e.status === 422) return "Please check your message and try again.";
  if (e.status === 404) return "This post isn't available anymore.";
  return e.message || "We couldn't send your Comfort. Please try again.";
}

function loadErrorMessage(err: unknown): string {
  const e = err as { status?: number } | null;
  if (e?.status === 404) return "This post isn't available anymore.";
  return "We couldn't load this post. Check your connection and try again.";
}

export default function SendComfortPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  const [loadError, setLoadError] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [identity, setIdentity] = useState<Identity>("named");
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    apiRequest<{ post: ApiPost | null }>(`/api/v1/posts/${postId}`)
      .then((res) => {
        if (!active) return;
        const p = res.data?.post;
        setPost(p ? formatApiPost(p) : null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setPost(null);
        setLoadError(loadErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoadingPost(false);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    if (phase !== "sent") return;
    const timer = window.setTimeout(
      () => navigate("/comforts", { state: { tab: "sent" } }),
      1800
    );
    return () => window.clearTimeout(timer);
  }, [phase, navigate]);

  if (loadingPost) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-deep" />
      </div>
    );
  }

  if (post?.mine) {
    return (
      <EmptyState
        icon={FileX}
        title="You can't send a Comfort to yourself"
        text="Comforts are meant to be sent to others to show support."
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  if (!postId || !post) {
    return (
      <EmptyState
        icon={FileX}
        title="This isn't available"
        text={loadError ?? "It may have been removed, so we can't send a Comfort here."}
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  const target: Person = { displayName: post.authorName, isAnonymous: post.authorName === null };
  const name = target.displayName ?? "the author";
  const currentUserName = getUser()?.profile?.displayName ?? "You";

  const identityOptions = [
    { value: "named", label: `Send as ${currentUserName}` },
    { value: "anonymous", label: "Send anonymously" },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    if (!postId || !message || phase !== "idle") return;

    setFailed(false);
    setErrorMessage(null);
    setPhase("sending");
    try {
      await Promise.all([
        sendComfortApi(postId, message, identity === "anonymous"),
        wait(MIN_SENDING_MS),
      ]);
      setPhase("sent");
    } catch (err: unknown) {
      setPhase("idle");
      setFailed(true);
      setErrorMessage(friendlyError(err));
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Send Comfort
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          A few kind words can mean a lot. They never have to reply.
        </p>
      </section>

      <div className="flex items-start gap-3 rounded-2xl bg-[#f1f3fa] p-4">
        <Avatar name={target.displayName} />
        <div className="min-w-0">
          <p className="text-[0.875rem] font-semibold text-navy">To {name}</p>
          <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-navy/60">
            {post.body}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Segmented
          legend="Send as"
          name="identity"
          options={identityOptions}
          value={identity}
          onChange={(v) => {
            if (isIdentity(v)) setIdentity(v);
          }}
        />

        <div>
          <label htmlFor="comfort-body" className="mb-2 block text-[0.8125rem] font-medium text-navy">
            Your message
          </label>
          <textarea
            id="comfort-body"
            rows={6}
            maxLength={MAX_LENGTH}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write something kind…"
            className="w-full resize-none rounded-2xl bg-[#f1f3fa] px-4 py-3 text-[0.9375rem] leading-[1.6] text-navy outline-none placeholder:text-navy/45 focus:ring-2 focus:ring-brand/40"
          />
          <p className="mt-1 px-1 text-right text-[0.75rem] text-navy/50">
            {body.length}/{MAX_LENGTH}
          </p>
        </div>

        {identity === "anonymous" ? (
          <p className="rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] leading-snug text-navy/70">
            They won't see your name. If they reply, you'll stay anonymous in the conversation.
          </p>
        ) : null}

        {failed ? (
          <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
            {errorMessage || "We couldn't send your Comfort. Please try again."}
          </p>
        ) : null}

        <PrimaryButton
          type="submit"
          disabled={!body.trim() || phase !== "idle"}
          className="w-full"
        >
          Send
        </PrimaryButton>
      </form>

      {phase !== "idle" && (
        <SendingAnimation
          phase={phase}
          onContinue={() => navigate("/comforts", { state: { tab: "sent" } })}
        />
      )}
    </div>
  );
}