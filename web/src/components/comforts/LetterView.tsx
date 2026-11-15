import type { ReactNode } from "react";
import AppreciationReactions from "./AppreciationReactions";
import { HANDWRITING } from "./handwriting";
import type { Appreciation } from "../../types/messaging";

type LetterViewProps = Readonly<{
  senderName: string;
  body: string;
  appreciation: Appreciation | null;
  onAppreciate: (next: Appreciation) => void;
  action?: ReactNode; // reply, or open the conversation
  note?: string;
  onClose: () => void;
  greetingName?: string;
  caption?: string;
  date?: string;
  showReactions?: boolean;
  reactionsDisabled?: boolean;
  reactionsError?: string | null;
}>;

function Stamp({ date }: Readonly<{ date: string }>) {
  return (
    <svg viewBox="0 0 96 64" width="96" height="64" aria-hidden className="shrink-0">
      <rect x="22" y="4" width="44" height="54" rx="2" fill="#fff" stroke="#c9ced9" strokeDasharray="2 2" />
      <rect x="27" y="9" width="34" height="44" fill="#d94b4b" />
      <path
        transform="translate(32 19)"
        fill="#fff"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
      <g transform="rotate(-12 66 42)" fill="none" stroke="#5a69a6" strokeOpacity="0.55">
        <circle cx="66" cy="42" r="19" />
        <circle cx="66" cy="42" r="15" />
        <text x="66" y="45" textAnchor="middle" fontSize="7" fill="#5a69a6" stroke="none">
          {date}
        </text>
      </g>
    </svg>
  );
}

export default function LetterView({
  senderName,
  body,
  appreciation,
  onAppreciate,
  action,
  note,
  onClose,
  greetingName,
  caption,
  date = "",
  showReactions = true,
  reactionsDisabled = false,
  reactionsError = null,
}: LetterViewProps) {
  return (
    <div className="welcome-rise mx-auto w-full max-w-sm">
      <article
        className="rounded-[6px] bg-[#f7f4ee] px-6 pb-4 pt-5 shadow-[0_22px_44px_-14px_rgba(27,53,102,0.3),0_2px_6px_rgba(27,53,102,0.08)]"
        style={{ transform: "rotate(-0.6deg)" }}
      >
        {caption ? <p className="text-center text-[0.6875rem] text-navy/45">{caption}</p> : null}

        <div
          className="mt-5 text-[1.5rem] text-navy/85"
          style={{
            fontFamily: HANDWRITING,
            lineHeight: "32px",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgba(27,53,102,0.09) 31px, rgba(27,53,102,0.09) 32px)",
          }}
        >
          {greetingName ? <p>Dear {greetingName},</p> : null}
          <p className={`whitespace-pre-line ${greetingName ? "mt-8" : ""}`}>{body}</p>
          <p className="mt-8">With kindness,</p>
          <p>{senderName}</p>
        </div>

        <div className="mt-4 flex justify-end">
          <Stamp date={date} />
        </div>
      </article>

      {showReactions ? (
        <AppreciationReactions
          value={appreciation}
          onSelect={onAppreciate}
          disabled={reactionsDisabled}
          error={reactionsError}
        />
      ) : null}

      {note ? (
        <p className="mt-5 rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] leading-snug text-navy/70">
          {note}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        {action}
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          Close
        </button>
      </div>
    </div>
  );
}