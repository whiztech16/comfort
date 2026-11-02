type ToggleProps = Readonly<{
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}>;

export default function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white/80 p-4">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="block text-[0.9375rem] font-semibold text-charcoal"
        >
          {label}
        </label>
        <p
          id={`${id}-hint`}
          className="mt-1 text-[0.8125rem] leading-snug text-charcoal/60"
        >
          {description}
        </p>
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6b8c] ${
          checked ? "bg-[#4a6b8c]" : "bg-[#cdd6e0]"
        }`}
      >
        <span
          aria-hidden
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}