import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "../../types/messaging";

type ChatThreadProps = Readonly<{
  messages: ChatMessage[];
  onSend: (body: string) => void;
}>;

export default function ChatThread({ messages, onSend }: ChatThreadProps) {
  const [text, setText] = useState("");
  const inputId = useId();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText("");
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Scrollable messages container */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-[0.9rem] text-navy/55">
            No messages yet. Say hello.
          </p>
        ) : (
          <ul aria-label="Messages" className="space-y-3 pb-2">
            {messages.map((message) => {
              const mine = message.from === "me";
              return (
                <li
                  key={message.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-[1.5] ${
                      mine
                        ? "rounded-br-md bg-brand-deep text-white"
                        : "rounded-bl-md bg-[#f1f3fa] text-navy"
                    }`}
                  >
                    {message.body}
                  </p>
                  <span className="mt-1 px-1 text-[0.6875rem] text-navy/45">
                    {message.sentAt}
                  </span>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      {/* Input bar pinned at bottom */}
      <div className="shrink-0 border-t border-black/[0.06] bg-white pt-3 pb-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Write a message
          </label>
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message…"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full bg-[#f1f3fa] px-5 text-[0.9rem] text-navy outline-none placeholder:text-navy/45 focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-white transition hover:brightness-105 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            <Send aria-hidden className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
