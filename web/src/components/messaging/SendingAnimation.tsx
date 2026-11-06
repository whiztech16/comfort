import { Check, Send } from "lucide-react";

type SendingAnimationProps = Readonly<{
  phase: "sending" | "sent";
  onContinue: () => void;
}>;

export default function SendingAnimation({
  phase,
  onContinue,
}: SendingAnimationProps) {
  const sent = phase === "sent";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white/90 px-6 text-center backdrop-blur-xl">
      <div className="flex h-28 w-28 items-center justify-center">
        {sent ? (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
            <Check aria-hidden className="h-12 w-12" strokeWidth={1.75} />
          </span>
        ) : (
          <span aria-hidden className="plane-fly text-brand-deep">
            <Send className="h-14 w-14" strokeWidth={1.5} />
          </span>
        )}
      </div>

      <p role="status" className="mt-6 text-[1.125rem] font-semibold text-navy">
        {sent ? "Your Comfort has been sent." : "Sending to the author’s inbox…"}
      </p>

      {sent ? (
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 h-11 rounded-full px-6 text-[0.875rem] font-medium text-brand-deep transition hover:bg-[#f1f3fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          View my sent Comforts
        </button>
      ) : null}
    </div>
  );
}