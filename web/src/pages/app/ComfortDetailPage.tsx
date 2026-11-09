import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, CheckCheck, Clock } from "lucide-react";
import EnvelopeReveal from "../../components/comforts/EnvelopeReveal";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink, PrimaryButton } from "../../components/shared/PrimaryButton";
import { FileX } from "lucide-react";
import {
  getComfort,
  markOpened,
  startConversation,
  setAppreciation,
} from "../../lib/sampleComforts";

const appreciationOptions = [
  "Thank you 💙",
  "This helped",
  "I needed this",
  "Means a lot",
] as const;

export default function ComfortDetailPage() {
  const { messageId = "" } = useParams();
  const navigate = useNavigate();
  const comfort = getComfort(messageId);

  const [hasOpened, setHasOpened] = useState(
    Boolean(comfort && (comfort.direction === "sent" || comfort.firstOpenedAt !== null))
  );

  if (!comfort) {
    return (
      <EmptyState
        icon={FileX}
        title="We couldn't find that message"
        text="It may have been removed."
        action={<PrimaryLink to="/comforts">Back to Comforts</PrimaryLink>}
      />
    );
  }

  const isSent = comfort.direction === "sent";
  const isReceived = comfort.direction === "received";

  // Who is the other person?
  const person = isSent ? comfort.to : comfort.from;
  const personName = person.displayName ?? "Anonymous";

  // Status line for sent comforts
  const statusIcon = isSent
    ? comfort.status === "opened"
      ? CheckCheck
      : Clock
    : null;
  const statusText = isSent
    ? comfort.status === "opened"
      ? "Opened"
      : "Delivered"
    : null;

  // First-time open envelope reveal experience
  if (isReceived && !hasOpened) {
    return (
      <div>
        <Link
          to="/comforts"
          state={{ tab: "received" }}
          className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Back to Comforts
        </Link>
        <EnvelopeReveal
          senderName={personName}
          onOpened={() => {
            markOpened(messageId);
            setHasOpened(true);
          }}
        />
      </div>
    );
  }

  function handleReply() {
    if (isReceived) {
      const convoId = startConversation(messageId);
      if (convoId) navigate(`/comforts/conversations/${convoId}`);
    }
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/comforts"
        state={{ tab: isSent ? "sent" : "received" }}
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {isSent ? "Sent" : "Received"}
      </Link>

      {/* Message card */}
      <article className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-navy/40">
              {isSent ? "You sent a Comfort to" : "Comfort from"}
            </p>
            <p className="mt-0.5 text-[1rem] font-semibold text-navy">
              {isSent ? (person.isAnonymous ? "an anonymous post" : personName) : personName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#eef1fa] px-3 py-1">
            {isSent ? (
              <Send aria-hidden className="h-3.5 w-3.5 text-brand-deep" strokeWidth={1.75} />
            ) : (
              <MessageCircle aria-hidden className="h-3.5 w-3.5 text-brand-deep" strokeWidth={1.75} />
            )}
            <span className="text-[0.75rem] font-medium text-brand-deep">
              {comfort.sentAt}
            </span>
          </div>
        </div>

        {/* Message body */}
        <div className="px-5 py-6">
          <p className="whitespace-pre-line text-[1rem] leading-[1.7] text-navy/85">
            {comfort.body}
          </p>
        </div>

        {/* Footer */}
        {(statusText || (isSent && comfort.appreciation)) && (
          <div className="border-t border-black/[0.06] bg-[#f8f9fc] px-5 py-3">
            {statusText && statusIcon && (
              <div className="flex items-center gap-1.5">
                {(() => {
                  const StatusIcon = statusIcon;
                  return <StatusIcon aria-hidden className="h-3.5 w-3.5 text-navy/40" strokeWidth={2} />;
                })()}
                <span className="text-[0.8125rem] text-navy/50">{statusText}</span>
              </div>
            )}
            {isSent && comfort.appreciation && (
              <p className="mt-1 text-[0.8125rem] italic text-navy/60">
                They said: &ldquo;{comfort.appreciation}&rdquo;
              </p>
            )}
          </div>
        )}
      </article>

      {/* Actions for received comforts */}
      {isReceived && (
        <div className="space-y-4">
          {/* Appreciation Pills */}
          {!comfort.appreciation && (
            <section className="space-y-2">
              <p className="text-[0.8125rem] font-medium text-navy/70">
                Send a quick appreciation back:
              </p>
              <div className="flex flex-wrap gap-2">
                {appreciationOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setAppreciation(messageId, opt);
                      navigate("/comforts");
                    }}
                    className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.875rem] font-medium text-navy transition hover:bg-[#eef1fa] hover:border-brand-deep/30 focus-visible:outline-2 focus-visible:outline-brand-deep"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </section>
          )}

          {comfort.appreciation && (
            <p className="rounded-2xl bg-[#eef1fa] px-4 py-3 text-[0.85rem] text-navy/70">
              You replied with: <span className="font-semibold text-navy">&ldquo;{comfort.appreciation}&rdquo;</span>
            </p>
          )}

          {/* Reply button — only if sender is not anonymous */}
          {!person.isAnonymous && !comfort.conversationId && (
            <PrimaryButton onClick={handleReply} className="gap-2">
              <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={2} />
              Reply to {personName}
            </PrimaryButton>
          )}

          {/* Go to existing conversation */}
          {comfort.conversationId && (
            <PrimaryLink
              to={`/comforts/conversations/${comfort.conversationId}`}
              className="gap-2"
            >
              <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={2} />
              Continue conversation
            </PrimaryLink>
          )}
        </div>
      )}
    </div>
  );
}
