import { useEffect, useRef, useState } from "react";

type EnvelopeRevealProps = Readonly<{
  senderName: string;
  onOpened: () => void;
}>;

const OPEN_MS = 1100;

export default function EnvelopeReveal({
  senderName,
  onOpened,
}: EnvelopeRevealProps) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const finished = useRef(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(timer.current);
    onOpened();
  }

  // A second tap while it is opening skips the animation
  function handleClick() {
    if (opening || reduceMotion) {
      finish();
      return;
    }
    setOpening(true);
    timer.current = window.setTimeout(finish, OPEN_MS);
  }

  return (
    <div className="flex min-h-[65svh] flex-col items-center justify-center text-center">
      <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-navy">
        {senderName} sent you a Comfort
      </h1>
      <p className="mt-2 max-w-[18rem] text-[0.9rem] text-navy/60">
        Open it whenever you’re ready. You never have to reply.
      </p>

      <button
        type="button"
        onClick={handleClick}
        aria-label={`Open the Comfort from ${senderName}`}
        className="mt-10 rounded-3xl p-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
      >
        <div className="relative h-48 w-72 drop-shadow-[0_18px_28px_rgba(27,53,102,0.18)]">
          {/* Back of the envelope */}
          <div className="absolute inset-0 rounded-2xl bg-[#c9d7ef]" />

          {/* The letter inside */}
          <div
            className={`absolute inset-x-5 bottom-3 top-5 z-10 space-y-2 rounded-lg bg-white px-4 pt-4 shadow-sm transition-transform duration-500 ease-out motion-reduce:transition-none ${
              opening ? "-translate-y-14 delay-300" : ""
            }`}
          >
            <span className="block h-1.5 w-3/4 rounded-full bg-[#e6ecf7]" />
            <span className="block h-1.5 w-1/2 rounded-full bg-[#e6ecf7]" />
            <span className="block h-1.5 w-2/3 rounded-full bg-[#e6ecf7]" />
          </div>

          {/* Front pocket */}
          <div
            className="absolute inset-0 z-20 rounded-2xl bg-gradient-to-b from-[#e4ecf9] to-[#d3dff3]"
            style={{
              clipPath: "polygon(0 100%, 0 18%, 50% 62%, 100% 18%, 100% 100%)",
            }}
          />

          {/* Flap */}
          <div
            className={`absolute inset-x-0 top-0 z-30 h-[62%] origin-top bg-gradient-to-b from-[#dbe5f6] to-[#c3d3ee] transition-transform duration-500 ease-in motion-reduce:transition-none ${
              opening ? "scale-y-0" : ""
            }`}
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />

          {/* Seal */}
          <span
            aria-hidden
            className={`absolute left-1/2 top-[62%] z-40 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-deep shadow-md transition-opacity duration-300 ${
              opening ? "opacity-0" : ""
            }`}
          />
        </div>
      </button>

      <p className="mt-6 text-[0.8125rem] text-navy/55">
        {opening ? "Opening…" : "Tap the envelope to open"}
      </p>
    </div>
  );
}