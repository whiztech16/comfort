import { Check } from "lucide-react";
import { appreciations } from "../../types/messaging";
import type { Appreciation } from "../../types/messaging";

type AppreciationReactionsProps = Readonly<{
  value: Appreciation | null;
  onSelect: (next: Appreciation) => void;
}>;

export default function AppreciationReactions({
  value,
  onSelect,
}: AppreciationReactionsProps) {
  return (
    <section aria-label="Let them know how it felt" className="mt-6">
      <p className="text-[0.875rem] font-medium text-navy">
        Let them know it meant something
      </p>
      <p className="mt-0.5 text-[0.75rem] text-navy/55">
        Only they will see this. It isn’t public.
      </p>

      <div role="group" aria-label="Appreciation" className="mt-3 flex flex-wrap gap-2">
        {appreciations.map((item) => {
          const selected = value === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(item)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
                selected
                  ? "bg-brand-deep text-white"
                  : "bg-[#f1f3fa] text-navy/80 hover:text-navy"
              }`}
            >
              {selected ? (
                <Check aria-hidden className="h-4 w-4" strokeWidth={2.25} />
              ) : null}
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}