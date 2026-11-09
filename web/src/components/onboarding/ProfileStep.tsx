import { useState } from "react";
import type { FormEvent } from "react";
import OnboardingShell from "./OnboardingShell";
import { PrimaryButton } from "../shared/PrimaryButton";
import Avatar from "../shared/Avatar";
import type { OnboardingData } from "../../types/onboarding";

type ProfileStepProps = Readonly<{
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
}>;

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-charcoal";

const fieldBase =
  "w-full border bg-white text-[0.9rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:ring-2";

const okBorder = "border-softgrey focus:border-calm focus:ring-calm/20";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

const errorClass = "mt-2 px-1 text-[0.8125rem] text-[#b4443a]";

function validate(data: OnboardingData) {
  const errors: { displayName?: string; username?: string } = {};

  if (data.displayName.trim().length < 2) {
    errors.displayName = "Please enter at least 2 characters.";
  }
  if (!/^[a-z0-9_]{3,20}$/.test(data.username)) {
    errors.username = "Use 3 to 20 letters, numbers or underscores.";
  }
  return errors;
}

export default function ProfileStep({
  data,
  onChange,
  onBack,
  onContinue,
  onSkip,
}: ProfileStepProps) {
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(data);
  const nameError = submitted ? errors.displayName : undefined;
  const usernameError = submitted ? errors.username : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!errors.displayName && !errors.username) onContinue();
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={2}
      title="Let’s make yourself at home."
      subtitle="Tell us how you’d like to appear. You can change this anytime."
      onBack={onBack}
    >
      {/* Profile avatar preview (initials only, no photo upload) */}
      <div className="mt-7 flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-sm border border-black/[0.04]">
        <Avatar name={data.displayName || "A"} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1rem] font-semibold text-charcoal">
            {data.displayName.trim() || "Your name"}
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-charcoal/60">
            Comfort uses initials to keep your identity quiet and pressure-free.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
        <div className="space-y-5">
          {/* Display name */}
          <div>
            <label htmlFor="display-name" className={labelClass}>
              Display name
            </label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              value={data.displayName}
              onChange={(event) =>
                onChange({ displayName: event.target.value })
              }
              maxLength={40}
              placeholder="e.g. Alex Rivera"
              autoComplete="name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "display-name-error" : undefined}
              className={`${fieldBase} h-12 rounded-full px-5 ${
                nameError ? badBorder : okBorder
              }`}
            />
            {nameError ? (
              <p id="display-name-error" role="alert" className={errorClass}>
                {nameError}
              </p>
            ) : null}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[0.9rem] text-charcoal/45"
              >
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                value={data.username}
                onChange={(event) =>
                  onChange({
                    username: event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, ""),
                  })
                }
                maxLength={20}
                placeholder="alex"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? "username-error" : undefined}
                className={`${fieldBase} h-12 rounded-full pl-9 pr-5 ${
                  usernameError ? badBorder : okBorder
                }`}
              />
            </div>
            {usernameError ? (
              <p id="username-error" role="alert" className={errorClass}>
                {usernameError}
              </p>
            ) : (
              <p className="mt-1 px-1 text-[0.775rem] text-charcoal/50">
                Letters, numbers, and underscores only.
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className={labelClass}>
              Bio <span className="font-normal text-charcoal/50">(optional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={160}
              value={data.bio}
              onChange={(event) => onChange({ bio: event.target.value })}
              placeholder="A line about what brings you here…"
              className={`${fieldBase} ${okBorder} resize-none rounded-2xl px-5 py-3`}
            />
            <p className="mt-1 px-1 text-right text-[0.75rem] text-charcoal/50">
              {data.bio.length}/160
            </p>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <PrimaryButton type="submit" className="w-full">
            Continue
          </PrimaryButton>
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 h-12 w-full rounded-full text-[0.9rem] font-medium text-charcoal/70 transition hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6b8c]"
          >
            Skip for now
          </button>
        </div>
      </form>
    </OnboardingShell>
  );
}
