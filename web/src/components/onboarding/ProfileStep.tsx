import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import OnboardingShell from "./OnboardingShell";
import { PrimaryButton } from "../shared/PrimaryButton";
import type { OnboardingData } from "../../types/onboarding";

type ProfileStepProps = Readonly<{
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onContinue: () => void;
}>;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-charcoal";

const fieldBase =
  "w-full border bg-white text-[0.9rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:ring-2";

const okBorder = "border-softgrey focus:border-calm focus:ring-calm/20";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

const errorClass = "mt-2 px-1 text-[0.8125rem] text-[#b4443a]";

const photoButton =
  "inline-flex h-9 cursor-pointer items-center rounded-full bg-white px-4 text-[0.8125rem] font-medium text-charcoal shadow-[0_1px_2px_rgba(38,55,70,0.08)] transition hover:bg-offwhite peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4a6b8c]";

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
}: ProfileStepProps) {
  const [submitted, setSubmitted] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Preview of the chosen photo. The temporary URL is released when it changes.
  useEffect(() => {
    if (!data.photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(data.photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data.photo]);

  const errors = validate(data);
  const nameError = submitted ? errors.displayName : undefined;
  const usernameError = submitted ? errors.username : undefined;
  const initial = (data.displayName.trim()[0] ?? "?").toUpperCase();

  // These checks are a convenience only. The server must validate the file itself.
  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is over 5 MB. Please choose a smaller one.");
      return;
    }
    setPhotoError(null);
    onChange({ photo: file });
  }

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
      {/* Profile photo (optional) */}
      <div className="mt-7 flex items-center gap-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Your profile photo preview"
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#899bc7] text-3xl font-semibold text-white ring-4 ring-white"
          >
            {initial}
          </span>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhoto}
              className="peer sr-only"
            />
            <label htmlFor="photo" className={photoButton}>
              {data.photo ? "Replace photo" : "Upload photo"}
            </label>

            {data.photo ? (
              <button
                type="button"
                onClick={() => onChange({ photo: null })}
                className="h-9 rounded-full px-3 text-[0.8125rem] font-medium text-charcoal/70 transition hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6b8c]"
              >
                Remove
              </button>
            ) : null}
          </div>

          <p className="mt-2 text-[0.8125rem] leading-snug text-charcoal/60">
            Optional. We’ll use your first initial if you skip it.
          </p>
          {photoError ? (
            <p role="alert" className={errorClass}>
              {photoError}
            </p>
          ) : null}
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
              type="text"
              value={data.displayName}
              onChange={(event) => onChange({ displayName: event.target.value })}
              maxLength={40}
              autoComplete="nickname"
              placeholder="How should we call you?"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "display-name-error" : undefined}
              className={`${fieldBase} h-12 rounded-full px-5 ${nameError ? badBorder : okBorder}`}
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
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[0.9rem] text-charcoal/50"
              >
                @
              </span>
              <input
                id="username"
                type="text"
                value={data.username}
                onChange={(event) =>
                  onChange({
                    username: event.target.value
                      .toLowerCase()
                      .replaceAll(/[^a-z0-9_]/g, ""),
                  })
                }
                maxLength={20}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="yourname"
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? "username-error" : undefined}
                className={`${fieldBase} h-12 rounded-full pl-9 pr-5 ${usernameError ? badBorder : okBorder}`}
              />
            </div>
            {usernameError ? (
              <p id="username-error" role="alert" className={errorClass}>
                {usernameError}
              </p>
            ) : null}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className={labelClass}>
              Bio <span className="font-normal text-charcoal/50">(optional)</span>
            </label>
            <textarea
              id="bio"
              rows={3}
              value={data.bio}
              onChange={(event) => onChange({ bio: event.target.value })}
              maxLength={160}
              placeholder="A line about you"
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
        </div>
      </form>
    </OnboardingShell>
  );
}