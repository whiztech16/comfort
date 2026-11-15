import { Check, Heart } from "lucide-react";
import { appreciations } from "../../types/messaging";
import type { Appreciation } from "../../types/messaging";
import { HANDWRITING } from "./handwriting";

type AppreciationReactionsProps = Readonly<{
  value: Appreciation | null;
  onSelect: (next: Appreciation) => void;
  disabled?: boolean;
  error?: string | null;
}>;

export default function AppreciationReactions({
  value,
  onSelect,
  disabled = false,
  error = null,
}: AppreciationReactionsProps) {
  // The backend accepts one response, so lock once one is chosen
  const locked = disabled || value !== null;

  return (
    <section aria-label="Let them know how it felt" className="mt-6">
      <p className="text-center text-[0.8125rem] font-medium text-navy">
        Let them know it meant something
      </p>
      <p className="mt-0.5 text-center text-[0.75rem] text-navy/55">
        Only they will see this. It isn’t public.
      </p>

      <div
        role="group"
        aria-label="Appreciation"
        className="mt-4 flex flex-wrap items-center justify-center gap-3"
      >
        {appreciations.map((item) => {
          const selected = value === item;
          const state = selected
            ? "border-brand-deep bg-brand-deep text-white disabled:opacity-100"
            : "border-black/[0.06] bg-white/85 text-navy hover:bg-white disabled:opacity-50";

          if (item === "Thank you") {
            return (
              <button
                key={item}
                type="button"
                aria-label={item}
                title={item}
                aria-pressed={selected}
                disabled={locked}
                onClick={() => onSelect(item)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
                  selected ? state : `${state} text-[#d94b4b]`
                }`}
              >
                <Heart
                  aria-hidden
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  fill={selected ? "currentColor" : "none"}
                />
              </button>
            );
          }

          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              disabled={locked}
              onClick={() => onSelect(item)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[1rem] shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${state}`}
              style={{ fontFamily: HANDWRITING }}
            >
              {selected ? <Check aria-hidden className="h-4 w-4" strokeWidth={2.25} /> : null}
              {item}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-center text-[0.8125rem] text-[#b4443a]">
          {error}
        </p>
      ) : null}
    </section>
  );
}