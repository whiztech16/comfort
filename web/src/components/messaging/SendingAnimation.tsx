import { PrimaryButton } from "../shared/PrimaryButton";

type Props = Readonly<{
  phase: "idle" | "sending" | "sent";
  onContinue: () => void;
}>;

export default function SendingAnimation({ phase, onContinue }: Props) {
  if (phase === "idle") return null;
  const sent = phase === "sent";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white px-6 text-center"
    >
      <style>{`
        @keyframes dove-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dove-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes dove-in {
          from { opacity: 0; transform: translateY(36px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dove-hover {
          0%, 100% { transform: translateY(0) rotate(-2deg) scale(1, 1); }
          50% { transform: translateY(-16px) rotate(2deg) scale(1.02, 0.97); }
        }
        @keyframes dove-away {
          0% { transform: translate(0, 0) rotate(-2deg) scale(1); opacity: 1; }
          100% { transform: translate(52vw, -78vh) rotate(-12deg) scale(0.3); opacity: 0; }
        }
        .dove-enter { animation: dove-fade-in 0.7s ease-out both; }
        .dove-away { animation: dove-fade-out 1.6s ease-in forwards; }
        @media (prefers-reduced-motion: no-preference) {
          .dove-enter { animation: dove-in 0.7s ease-out both; }
          .dove-hover { animation: dove-hover 2.4s ease-in-out infinite; }
          .dove-away { animation: dove-away 1.6s cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
        }
      `}</style>

      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(45%_60%_at_15%_25%,rgba(111,140,202,0.35),transparent_70%),radial-gradient(40%_55%_at_92%_80%,rgba(165,190,238,0.5),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-[60%] rounded-full bg-white/70 blur-3xl"
      />

      <div className="relative">
        <div className="dove-enter">
          <div className={sent ? "dove-away" : "dove-hover"}>
            <img
              src="/dove-letter.png"
              alt=""
              width={320}
              className="w-[260px] select-none sm:w-[320px]"
              style={{ filter: "drop-shadow(0 20px 22px rgba(27,53,102,0.2))" }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-10 space-y-1.5">
        <p className="text-[1.25rem] font-semibold tracking-[-0.01em] text-navy">
          {sent ? "Your Comfort is on its way" : "Sending your kind words…"}
        </p>
        <p className="text-[0.875rem] text-navy/55">
          {sent ? "They’ll find it the next time they open Comfort." : "This only takes a moment."}
        </p>
      </div>

      {sent ? (
        <div className="relative mt-8">
          <PrimaryButton type="button" onClick={onContinue}>
            Done
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}