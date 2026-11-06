import { useEffect, useReducer } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileX } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import ChatThread from "../../components/messaging/ChatThread";
import SafetyMenu from "../../components/safety/SafetyMenu";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import {
  getConversation,
  markConversationRead,
  sendChat,
} from "../../lib/sampleComforts";

export default function ConversationPage() {
  const { conversationId = "" } = useParams();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const conversation = getConversation(conversationId);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  if (!conversation) {
    return (
      <EmptyState
        icon={FileX}
        title="We couldn’t find that conversation"
        text="It may have been removed."
        action={<PrimaryLink to="/comforts">Back to Comforts</PrimaryLink>}
      />
    );
  }

  function handleSend(body: string) {
    sendChat(conversationId, body);
    refresh();
  }

  const name = conversation.participant.displayName;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="mb-2 flex shrink-0 items-center gap-3 border-b border-black/[0.05] pb-3">
        <Link
          to="/comforts"
          state={{ tab: "conversations" }}
          aria-label="Back to Comforts"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3fa] text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <Avatar name={name} />
        <p className="min-w-0 flex-1 truncate text-[1rem] font-semibold text-navy">
          {name}
        </p>
        <SafetyMenu name={name} reportKind="message" />
      </header>

      <ChatThread messages={conversation.messages} onSend={handleSend} />
    </div>
  );
}
