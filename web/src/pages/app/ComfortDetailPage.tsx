import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, CheckCheck, Clock, FileX, Trash2 } from "lucide-react";
import EnvelopeReveal from "../../components/comforts/EnvelopeReveal";
import LetterView from "../../components/comforts/LetterView";
import DeleteComfortModal from "../../components/comforts/DeleteComfortModal";
import { EmptyState } from "../../components/shared/States";
import { ComfortDetailSkeleton } from "../../components/shared/Skeleton";
import { PrimaryLink, PrimaryButton } from "../../components/shared/PrimaryButton";
import { useChatKey } from "../../context/ChatKeyContext";
import { useToast } from "../../hooks/useToast";
import { getUser } from "../../lib/api";
import {
  getComfortApi,
  openComfortApi,
  appreciateComfortApi,
  deleteComfortApi,
} from "../../lib/comfortsApi";
import { createConversationApi } from "../../lib/conversationsApi";
import type { Appreciation, Comfort } from "../../types/messaging";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorText(err: unknown, fallback: string): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  return e.message || fallback;
}

export default function ComfortDetailPage() {
  const { messageId = "" } = useParams();
  const navigate = useNavigate();
  const { ensureChatKey } = useChatKey();
  const { showToast } = useToast();

  const [comfort, setComfort] = useState<Comfort | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<"notfound" | "failed" | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [submittingAppreciation, setSubmittingAppreciation] = useState(false);
  const [appreciationError, setAppreciationError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!UUID_RE.test(messageId)) {
      setComfort(null);
      setLoadError("notfound");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);
    getComfortApi(messageId)
      .then((data) => {
        if (!active) return;
        setComfort(data);
        setHasOpened(data.direction === "sent" || data.firstOpenedAt !== null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setComfort(null);
        setLoadError((err as { status?: number } | null)?.status === 404 ? "notfound" : "failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [messageId]);

  if (loading) return <ComfortDetailSkeleton />;

  if (!comfort) {
    return (
      <EmptyState
        icon={FileX}
        title={loadError === "failed" ? "We couldn’t load that message" : "We couldn’t find that message"}
        text={
          loadError === "failed"
            ? "Check your connection and try again."
            : "It may have been removed."
        }
        action={<PrimaryLink to="/comforts">Back to Comforts</PrimaryLink>}
      />
    );
  }

  const isSent = comfort.direction === "sent";
  const isReceived = comfort.direction === "received";

  const person = isSent ? comfort.to : comfort.from;
  const personName = person.displayName ?? "Anonymous";
  const myName = getUser()?.profile?.displayName ?? "A friend";

  const statusIcon = isSent ? (comfort.status === "opened" ? CheckCheck : Clock) : null;
  const statusText = isSent ? (comfort.status === "opened" ? "Opened" : "Delivered") : null;

  async function handleOpen() {
    setOpenError(null);
    try {
      const opened = await openComfortApi(messageId);
      setComfort(opened);
      setHasOpened(true);
    } catch (err: unknown) {
      setOpenError(errorText(err, "We couldn’t open this Comfort. Please try again."));
    }
  }

  async function handleAppreciate(opt: Appreciation) {
    if (submittingAppreciation) return;
    setSubmittingAppreciation(true);
    setAppreciationError(null);
    try {
      const updated = await appreciateComfortApi(messageId, opt);
      setComfort(updated);
    } catch (err: unknown) {
      setAppreciationError(errorText(err, "We couldn’t send your appreciation. Please try again."));
    } finally {
      setSubmittingAppreciation(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteComfortApi(messageId);
    } catch (err: unknown) {
      if ((err as { status?: number } | null)?.status !== 404) throw err;
    }
    showToast("Comfort deleted.");
    navigate("/comforts", { state: { tab: isSent ? "sent" : "received" } });
  }

  // Replying starts an encrypted conversation, so the chat key comes first
  async function handleReply() {
    if (!isReceived || replying) return;
    setReplyError(null);
    setReplying(true);
    try {
      if (!(await ensureChatKey())) return;
      const conversation = await createConversationApi(messageId);
      navigate(`/comforts/conversations/${conversation.id}`);
    } catch (err: unknown) {
      if ((err as { status?: number } | null)?.status === 409) {
        // A conversation may already exist (another tab, or a retry)
        try {
          const fresh = await getComfortApi(messageId);
          if (fresh.direction === "received" && fresh.conversationId) {
            navigate(`/comforts/conversations/${fresh.conversationId}`);
            return;
          }
        } catch {
          // Fall through to the message below
        }
      }
      setReplyError(errorText(err, "We couldn’t start the conversation. Please try again."));
    } finally {
      setReplying(false);
    }
  }

  function handleClose() {
    navigate("/comforts", { state: { tab: isSent ? "sent" : "received" } });
  }

  if (isReceived && !hasOpened) {
    return (
      <div className="space-y-4">
        <Link
          to="/comforts"
          state={{ tab: "received" }}
          className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Back to Comforts
        </Link>
        <EnvelopeReveal senderName={personName} onOpened={handleOpen} />
        {openError ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f1f3fa] px-4 py-3">
            <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
              {openError}
            </p>
            <button
              type="button"
              onClick={() => void handleOpen()}
              className="text-[0.8125rem] font-medium text-navy underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  let replyAction = null;
  let replyNote: string | undefined;
  if (isReceived) {
    if (comfort.conversationId) {
      replyAction = (
        <PrimaryLink to={`/comforts/conversations/${comfort.conversationId}`} className="gap-2">
          <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={2} />
          Continue conversation
        </PrimaryLink>
      );
    } else {
      replyAction = (
        <PrimaryButton onClick={() => void handleReply()} disabled={replying} className="gap-2">
          <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={2} />
          {replying ? "Opening…" : person.isAnonymous ? "Reply" : `Reply to ${personName}`}
        </PrimaryButton>
      );
      if (person.isAnonymous) replyNote = "They’ll stay anonymous in the conversation.";
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/comforts"
        state={{ tab: isSent ? "sent" : "received" }}
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {isSent ? "Sent" : "Received"}
      </Link>

      <LetterView
        senderName={isSent ? myName : person.isAnonymous ? "A kind stranger" : personName}
        greetingName={isSent ? (person.isAnonymous ? "friend" : personName) : myName}
        caption={
          isSent
            ? `You sent this to ${person.isAnonymous ? "an anonymous post" : personName}`
            : "A Comfort for you"
        }
        date={comfort.sentAt}
        body={comfort.body}
        showReactions={isReceived}
        appreciation={isReceived ? comfort.appreciation : null}
        onAppreciate={(opt) => void handleAppreciate(opt)}
        reactionsDisabled={submittingAppreciation}
        reactionsError={appreciationError}
        action={replyAction}
        note={replyNote}
        onClose={handleClose}
      />

      {replyError ? (
        <p role="alert" className="text-center text-[0.8125rem] text-[#b4443a]">
          {replyError}
        </p>
      ) : null}

      {isSent && (statusText || comfort.appreciation) ? (
        <div className="mx-auto max-w-sm space-y-1 text-center">
          {statusText && statusIcon ? (
            <div className="flex items-center justify-center gap-1.5">
              {(() => {
                const StatusIcon = statusIcon;
                return <StatusIcon aria-hidden className="h-3.5 w-3.5 text-navy/40" strokeWidth={2} />;
              })()}
              <span className="text-[0.8125rem] text-navy/50">{statusText}</span>
            </div>
          ) : null}
          {comfort.appreciation ? (
            <p className="text-[0.8125rem] italic text-navy/60">
              They said: &ldquo;{comfort.appreciation}&rdquo;
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.8125rem] font-medium text-navy/50 transition hover:text-[#b4443a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Delete this Comfort
        </button>
      </div>

      {confirmingDelete ? (
        <DeleteComfortModal onClose={() => setConfirmingDelete(false)} onConfirm={handleDelete} />
      ) : null}
    </div>
  );
}