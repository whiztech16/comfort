import { Heart } from "lucide-react";
import type { Appreciation } from "../../types/messaging";

const HAND = '"La Belle Aurore", "Segoe Script", "Bradley Hand", cursive';

const PILLS: Appreciation[] = ["This helped", "Made my day"];
const ICON_OPTION: Appreciation = "Thank you";

type Props = Readonly<{
  direction: "received" | "sent";
  caption: string;
  greetingName: string;
  body: string;
  sentAt: string;
  appreciation: Appreciation | null;
  submitting: boolean;
  error: string | null;
  onAppreciate: (option: Appreciation) => void;
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

export default function ComfortLetter({
  direction,
  caption,
  greetingName,
  body,
  sentAt,
  appreciation,
  submitting,
  error,
  onAppreciate,
}: Props) {
  const received = direction === "received";

  return (
    <div className="mx-auto w-full max-w-sm">
      <style>{`
        @keyframes letter-in {
          from { opacity: 0; transform: translateY(18px) rotate(-1.4deg) scale(0.97); }
          to { opacity: 1; transform: translateY(0) rotate(-0.6deg) scale(1); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .letter-paper { animation: letter-in 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        }
      `}</style>

      <article
        className="letter-paper rounded-[6px] bg-[#f7f4ee] px-6 pb-4 pt-5 shadow-[0_22px_44px_-14px_rgba(27,53,102,0.3),0_2px_6px_rgba(27,53,102,0.08)]"
        style={{ transform: "rotate(-0.6deg)" }}
      >
        <p className="text-center text-[0.6875rem] text-navy/45">{caption}</p>

        <div
          className="mt-5 text-[1.5rem] text-navy/85"
          style={{
            fontFamily: HAND,
            lineHeight: "32px",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgba(27,53,102,0.09) 31px, rgba(27,53,102,0.09) 32px)",
          }}
        >
          <p>Dear {greetingName},</p>
          <p className="mt-8 whitespace-pre-line">{body}</p>
        </div>

        <div className="mt-4 flex justify-end">
          <Stamp date={sentAt} />
        </div>
      </article>

      {received ? (
        <div className="mt-6">
          {appreciation ? (
            <p className="text-center text-[1.25rem] text-navy/70" style={{ fontFamily: HAND }}>
              You replied: &ldquo;{appreciation}&rdquo;
            </p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3">
                {PILLS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={submitting}
                    onClick={() => onAppreciate(option)}
                    className="rounded-full border border-black/[0.06] bg-white/85 px-5 py-2.5 text-[1rem] text-navy shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-50"
                    style={{ fontFamily: HAND }}
                  >
                    {option}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={ICON_OPTION}
                  title={ICON_OPTION}
                  disabled={submitting}
                  onClick={() => onAppreciate(ICON_OPTION)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white/85 text-[#d94b4b] shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-50"
                >
                  <Heart aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>
              {error ? (
                <p role="alert" className="mt-3 text-center text-[0.8125rem] text-[#b4443a]">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}