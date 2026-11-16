import { Plus } from "lucide-react";

type FaqItemProps = Readonly<{
  id: string;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}>;

export default function FaqItem({ id, question, answer, open, onToggle }: FaqItemProps) {
  return (
    <div className="border-b border-black/[0.08] last:border-b-0">
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug text-navy">{question}</span>
          <Plus
            aria-hidden
            className={`h-4 w-4 shrink-0 text-navy/50 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
            strokeWidth={1.75}
          />
        </button>
      </h3>

      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`} className="faq-panel" data-open={open}>
        <div>
          <p className="pb-4 pr-8 text-[0.8125rem] leading-[1.65] text-navy/60">{answer}</p>
        </div>
      </div>
    </div>
  );
}