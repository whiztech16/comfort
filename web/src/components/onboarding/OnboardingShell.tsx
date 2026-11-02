import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type OnboardingShellProps = Readonly<{
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
}>;

export default function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
}: OnboardingShellProps) {
  return (
    <main className="flex min-h-svh justify-center bg-gradient-to-b from-[#dceaf7] via-[#eef4fa] to-white md:items-center">
      <div className="welcome-rise flex min-h-svh w-full max-w-[28rem] flex-col px-6 pb-8 pt-6 md:min-h-0 md:py-12">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-charcoal transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6b8c]"
          >
            <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <p className="text-[0.8125rem] font-medium text-charcoal/60">
            Step {step} of {totalSteps}
          </p>
          <span aria-hidden className="w-10" />
        </div>

        <div aria-hidden className="mt-4 flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              key={`segment-${index + 1}`}
              className={`h-1 flex-1 rounded-full ${
                index < step ? "bg-[#4a6b8c]" : "bg-[#4a6b8c]/15"
              }`}
            />
          ))}
        </div>

        <h1 className="mt-8 text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-charcoal">
          {title}
        </h1>
        <p className="mt-2 text-[0.9rem] leading-[1.6] text-charcoal/60">
          {subtitle}
        </p>

        {children}
      </div>
    </main>
  );
}