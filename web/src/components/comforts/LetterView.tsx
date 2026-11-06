import type { ReactNode } from "react";
import AppreciationReactions from "./AppreciationReactions";
import type { Appreciation } from "../../types/messaging";

type LetterViewProps = Readonly<{
  senderName: string;
  body: string;
  appreciation: Appreciation | null;
  onAppreciate: (next: Appreciation) => void;
  action?: ReactNode; // reply, or open the conversation
  note?: string;
  onClose: () => void;
}>;

export default function LetterView({
  senderName,
  body,
  appreciation,
  onAppreciate,
  action,
  note,
  onClose,
}: LetterViewProps) {
  return (
    <div className="welcome-rise">
      <article className="rounded-3xl border border-black/[0.06] bg-gradient-to-b from-[#eef2fb] to-white p-6 shadow-[0_14px_40px_rgba(27,53,102,0.1)] sm:p-8">
        <p className="whitespace-pre-line font-serif text-[1.125rem] leading-[1.7] text-navy/90">
          {body}
        </p>

        <div className="mt-8 border-t border-black/[0.06] pt-4">
          <p className="text-[0.875rem] text-navy/60">With kindness,</p>
          <p className="mt-0.5 text-[1rem] font-semibold text-navy">
            {senderName}
          </p>
        </div>
      </article>

      <AppreciationReactions value={appreciation} onSelect={onAppreciate} />

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