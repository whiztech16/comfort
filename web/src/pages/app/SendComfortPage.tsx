import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX, Loader2 } from "lucide-react";
import SendingAnimation from "../../components/messaging/SendingAnimation";
import Segmented from "../../components/shared/Segmented";
import Avatar from "../../components/shared/Avatar";
import { EmptyState } from "../../components/shared/States";
import {
  PrimaryButton,
  PrimaryLink,
} from "../../components/shared/PrimaryButton";
import { currentUser } from "../../lib/currentUser";
import { addSentComfort } from "../../lib/sampleComforts";
import { getPost } from "../../lib/samplePosts";
import { getProfileByUsername } from "../../lib/sampleProfiles";
import { apiRequest, getUser } from "../../lib/api";
import { sendComfortApi } from "../../lib/comfortsApi";
import type { Person } from "../../types/messaging";

type Identity = "named" | "anonymous";
type Phase = "idle" | "sending" | "sent";

const MAX_LENGTH = 500;

// Works from a post (/send-comfort/:postId) or from a profile (/send-comfort/to/:username)
export default function SendComfortPage() {
  const { postId, username } = useParams();
  const navigate = useNavigate();
  const samplePost = postId ? getPost(postId) : undefined;
  const profile = username ? getProfileByUsername(username) : undefined;

  const [post, setPost] = useState<{ authorName: string | null; body: string } | null>(
    samplePost ? { authorName: samplePost.authorName, body: samplePost.body } : null
  );
  const [loadingPost, setLoadingPost] = useState(Boolean(postId && !samplePost));

  const [body, setBody] = useState("");
  const [identity, setIdentity] = useState<Identity>("named");
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If postId is not found in samplePosts, attempt to fetch from backend API
  useEffect(() => {
    if (!postId || samplePost) return;
    let active = true;
    apiRequest<{ post: { author?: { displayName?: string | null }; content: string } | null }>(`/api/v1/posts/${postId}`)
      .then((res) => {
        if (!active) return;
        const p = res.data?.post;
        if (p) {
          setPost({
            authorName: p.author?.displayName ?? null,
            body: p.content,
          });
        }
      })
      .catch(() => {
        // Post not found or error
      })
      .finally(() => {
        if (active) setLoadingPost(false);
      });
    return () => {
      active = false;
    };
  }, [postId, samplePost]);

  // After "sent" the person lands on their Sent tab, or can tap to go sooner
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

  // Who it goes to, and what it is about
  let recipient: Person | null = null;
  let context = "";
  if (post) {
    recipient = {
      displayName: post.authorName,
      isAnonymous: post.authorName === null,
    };
    context = post.body;
  } else if (profile) {
    recipient = { displayName: profile.displayName, isAnonymous: false };
    context = profile.bio || "Public profile";
  }

  if (!recipient) {
    return (
      <EmptyState
        icon={FileX}
        title="This isn’t available"
        text="It may have been removed, so we can’t send a Comfort here."
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  // The person has chosen not to receive Comforts
  if (!post && profile && !profile.acceptsComforts) {
    return (
      <EmptyState
        icon={FileX}
        title={`${profile.displayName} isn’t receiving Comforts`}
        text="They’ve chosen not to receive supportive messages right now."
        action={<PrimaryLink to={`/u/${profile.username}`}>Back to profile</PrimaryLink>}
      />
    );
  }

  const target: Person = recipient;
  const name = target.displayName ?? "the author";
  const backTo = !post && profile ? `/u/${profile.username}` : "/home";

  const loggedInUser = getUser();
  const currentUserName = loggedInUser?.profile?.displayName || currentUser.name;

  const identityOptions = [
    { value: "named", label: `Send as ${currentUserName}` },
    { value: "anonymous", label: "Send anonymously" },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    if (!message || phase !== "idle") return;

    setFailed(false);
    setErrorMessage(null);
    setPhase("sending");
    try {
      if (postId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
        await sendComfortApi(postId, message, identity === "anonymous");
      } else if (postId) {
        // Fallback or attempt API, fallback to mock if mock post ID
        try {
          await sendComfortApi(postId, message, identity === "anonymous");
        } catch (apiErr: unknown) {
          if (postId.startsWith("p")) {
            addSentComfort(target, message);
          } else {
            throw apiErr;
          }
        }
      } else {
        addSentComfort(target, message);
      }
      setPhase("sent");
    } catch (err: unknown) {
      setPhase("idle");
      setFailed(true);
      const errMsg = err instanceof Error ? err.message : "We couldn't send your Comfort. Please try again.";
      setErrorMessage(errMsg);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to={backTo}
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
            {context}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Segmented
          legend="Send as"
          name="identity"
          options={identityOptions}
          value={identity}
          onChange={setIdentity}
        />

        <div>
          <label
            htmlFor="comfort-body"
            className="mb-2 block text-[0.8125rem] font-medium text-navy"
          >
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
            They won’t see your name, and an anonymous Comfort can’t start a
            conversation.
          </p>
        ) : null}

        {failed ? (
          <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
            {errorMessage || "We couldn’t send your Comfort. Please try again."}
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

      {phase === "idle" ? null : (
        <SendingAnimation
          phase={phase}
          onContinue={() => navigate("/comforts", { state: { tab: "sent" } })}
        />
      )}
    </div>
  );
}


