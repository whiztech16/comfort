import { Link } from "react-router-dom";
import Avatar from "../shared/Avatar";
import type { ConversationSummary } from "../../types/messaging";

export default function ConversationRow({
  conversation,
}: Readonly<{ conversation: ConversationSummary }>) {
  const name = conversation.participant.displayName ?? "Anonymous";

  let preview = "No messages yet";
  if (conversation.locked) preview = "This conversation is closed";
  else if (conversation.unread) preview = "New message";
  else if (conversation.hasMessages) preview = "Open the conversation";

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
                conversation.unread ? "font-semibold text-navy" : "font-medium text-navy/85"
              }`}
            >
              {name}
            </p>
            <p className="shrink-0 text-[0.75rem] text-navy/50">{conversation.lastActivity}</p>
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
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-deep" />
            <span className="sr-only">Unread</span>
          </>
        ) : null}
      </Link>
    </li>
  );
}