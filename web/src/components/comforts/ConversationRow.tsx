import { Link } from "react-router-dom";
import Avatar from "../shared/Avatar";
import type { Conversation } from "../../types/messaging";

export default function ConversationRow({
  conversation,
}: Readonly<{ conversation: Conversation }>) {
  const last = conversation.messages[conversation.messages.length - 1];
  const preview = last
    ? `${last.from === "me" ? "You: " : ""}${last.body}`
    : "No messages yet";

  return (
    <li>
      <Link
        to={`/comforts/conversations/${conversation.id}`}
        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-[#f4f6fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <Avatar name={conversation.participant.displayName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={`truncate text-[0.9375rem] ${
                conversation.unread
                  ? "font-semibold text-navy"
                  : "font-medium text-navy/85"
              }`}
            >
              {conversation.participant.displayName}
            </p>
            <p className="shrink-0 text-[0.75rem] text-navy/50">
              {conversation.lastActivity}
            </p>
          </div>
          <p
            className={`truncate text-[0.875rem] ${
              conversation.unread ? "text-navy/80" : "text-navy/55"
            }`}
          >
            {preview}
          </p>
        </div>

        {conversation.unread ? (
          <>
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-deep"
            />
            <span className="sr-only">Unread</span>
          </>
        ) : null}
      </Link>
    </li>
  );
}