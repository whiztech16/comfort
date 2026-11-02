import { Info } from "lucide-react";
import OnboardingShell from "./OnboardingShell";
import Toggle from "../shared/Toggle";
import { PrimaryButton } from "../shared/PrimaryButton";
import type { OnboardingData } from "../../types/onboarding";

type PrivacyStepProps = Readonly<{
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onFinish: () => void;
}>;

export default function PrivacyStep({
  data,
  onChange,
  onBack,
  onFinish,
}: PrivacyStepProps) {
  return (
    <OnboardingShell
      step={2}
      totalSteps={2}
      title="Your privacy, your choice"
      subtitle="Choose who can find you and what you receive. You can change these anytime in Settings."
      onBack={onBack}
    >
      <div className="mt-7 space-y-3">
        <Toggle
          id="discoverable"
          label="Let others find my profile"
          description="Your profile can appear in Explore and search. Off keeps it private."
          checked={data.discoverable}
          onChange={(next) => onChange({ discoverable: next })}
        />
        <Toggle
          id="message-requests"
          label="Allow private message requests"
          description="People can ask to message you privately. You can decline any request."
          checked={data.allowMessageRequests}
          onChange={(next) => onChange({ allowMessageRequests: next })}
        />
        <Toggle
          id="supportive-messages"
          label="Receive supportive messages"
          description="Get kind notes and encouragement from the community. You never have to reply."
          checked={data.receiveSupportiveMessages}
          onChange={(next) => onChange({ receiveSupportiveMessages: next })}
        />
      </div>

      <p className="mt-5 flex gap-2.5 text-[0.8125rem] leading-snug text-charcoal/60">
        <Info
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#4a6b8c]"
          strokeWidth={1.75}
        />
        When you post or send a message, you’ll choose each time whether to use
        your name or stay anonymous.
      </p>

      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onFinish} className="w-full">
          Finish
        </PrimaryButton>
      </div>
    </OnboardingShell>
  );
}