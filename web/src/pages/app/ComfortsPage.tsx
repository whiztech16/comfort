import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Lock, Mail, MessagesSquare, Send, Loader2 } from "lucide-react";
import ComfortRow from "../../components/comforts/ComfortRow";
import ConversationRow from "../../components/comforts/ConversationRow";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import {
  listConversations,
  listReceived,
  listSent,
} from "../../lib/sampleComforts";
import {
  listReceivedComfortsApi,
  listSentComfortsApi,
} from "../../lib/comfortsApi";
import type { ReceivedComfort, SentComfort } from "../../types/messaging";

const tabs = [
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
  { id: "conversations", label: "Conversations" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default function ComfortsPage() {
  const location = useLocation();
  const startTab = (location.state as { tab?: Tab } | null)?.tab ?? "received";
  const [tab, setTab] = useState<Tab>(startTab);

  const [received, setReceived] = useState<ReceivedComfort[]>([]);
  const [sent, setSent] = useState<SentComfort[]>([]);
  const [loading, setLoading] = useState(true);

  const conversations = listConversations();

  useEffect(() => {
    let active = true;

    Promise.allSettled([listReceivedComfortsApi(), listSentComfortsApi()])
      .then(([recResult, sentResult]) => {
        if (!active) return;
        if (recResult.status === "fulfilled") {
          setReceived(recResult.value.items);
        } else {
          // Fall back to sample data if offline or unauthorized
          setReceived(listReceived());
        }

        if (sentResult.status === "fulfilled") {
          setSent(sentResult.value.items);
        } else {
          setSent(listSent());
        }
      })
      .catch(() => {
        if (!active) return;
        setReceived(listReceived());
        setSent(listSent());
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  let panel;
  if (tab === "received") {
    panel =
      received.length > 0 ? (
        <ul className="divide-y divide-black/[0.05]">
          {received.map((comfort) => (
            <ComfortRow key={comfort.id} comfort={comfort} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Mail}
          title="No Comforts yet"
          text="Kind messages sent to you will appear here."
        />
      );
  } else if (tab === "sent") {
    panel =
      sent.length > 0 ? (
        <ul className="divide-y divide-black/[0.05]">
          {sent.map((comfort) => (
            <ComfortRow key={comfort.id} comfort={comfort} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Send}
          title="You haven’t sent a Comfort yet"
          text="Find a post that moves you and send a few kind words."
          action={<PrimaryLink to="/home">Browse posts</PrimaryLink>}
        />
      );
  } else {
    panel =
      conversations.length > 0 ? (
        <ul className="divide-y divide-black/[0.05]">
          {conversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          text="When you reply to a Comfort, your conversation will appear here."
        />
      );
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Comforts
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Kind messages you’ve received and sent.
        </p>
      </section>

      <div
        role="tablist"
        aria-label="Comforts"
        className="grid grid-cols-3 gap-1 rounded-full bg-[#f1f3fa] p-1"
      >
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls="comforts-panel"
              onClick={() => setTab(id)}
              className={`h-10 rounded-full text-[0.8125rem] font-medium transition focus-visible:outline-2 focus-visible:outline-brand-deep ${
                active
                  ? "bg-white text-navy shadow-sm"
                  : "text-navy/65 hover:text-navy"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div id="comforts-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-brand-deep" />
          </div>
        ) : (
          panel
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#f1f3fa] p-4">
        <Lock
          aria-hidden
          className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep"
          strokeWidth={1.75}
        />
        <div>
          <p className="text-[0.875rem] font-semibold text-navy">
            Your privacy matters
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-navy/60">
            Comforts are private and only visible to you and the person you
            sent them to.
          </p>
        </div>
      </div>
    </div>
  );
}