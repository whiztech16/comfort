import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "../../types/messaging";

type ChatThreadProps = Readonly<{
  messages: ChatMessage[];
  // Return false (or reject) to keep the text so the user can retry
  onSend: (body: string) => void | boolean | Promise<void | boolean>;
  error?: string | null;
  disabled?: boolean;
  disabledNote?: string;
  maxLength?: number;
  hasEarlier?: boolean;
  loadingEarlier?: boolean;
  onLoadEarlier?: () => void;
}>;

export default function ChatThread({
  messages,
  onSend,
  error = null,
  disabled = false,
  disabledNote = "This conversation is closed.",
  maxLength = 1000,
  hasEarlier = false,
  loadingEarlier = false,
  onLoadEarlier,
}: ChatThreadProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const inputId = useId();
  const endRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);

  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: firstScroll.current ? "auto" : "smooth",
      block: "end",
    });
    firstScroll.current = false;
  }, [lastId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending || disabled) return;

    setSending(true);
    setSendFailed(false);
    try {
      const result = await onSend(body);
      if (result === false) {
        setSendFailed(true);
      } else {
        setText("");
      }
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  const message = error ?? (sendFailed ? "We couldn’t send that. Please try again." : null);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {hasEarlier ? (
          <div className="flex justify-center pb-3">
            <button
              type="button"
              onClick={onLoadEarlier}
              disabled={loadingEarlier}
              className="rounded-full bg-[#f1f3fa] px-4 py-2 text-[0.8125rem] font-medium text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-60"
            >
              {loadingEarlier ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-[0.9rem] text-navy/55">
            No messages yet. Say hello.
          </p>
        ) : (
          <ul aria-label="Messages" className="space-y-3 pb-2">
            {messages.map((item) => {
              const mine = item.from === "me";
              return (
                <li
                  key={item.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <p
                    className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-[1.5] ${
                      mine
                        ? "rounded-br-md bg-brand-deep text-white"
                        : "rounded-bl-md bg-[#f1f3fa] text-navy"
                    }`}
                  >
                    {item.body}
                  </p>
                  <span className="mt-1 px-1 text-[0.6875rem] text-navy/45">{item.sentAt}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white pb-2 pt-3">
        {disabled ? (
          <p className="rounded-2xl bg-[#f1f3fa] px-4 py-3 text-center text-[0.8125rem] text-navy/60">
            {disabledNote}
          </p>
        ) : (
          <>
            {message ? (
              <p role="alert" className="mb-2 px-2 text-[0.8125rem] text-[#b4443a]">
                {message}
              </p>
            ) : null}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor={inputId} className="sr-only">
                Write a message
              </label>
              <input
                id={inputId}
                type="text"
                value={text}
                maxLength={maxLength}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write a message…"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-full bg-[#f1f3fa] px-5 text-[0.9rem] text-navy outline-none placeholder:text-navy/45 focus:ring-2 focus:ring-brand/40"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!text.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-40"
              >
                <Send aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}