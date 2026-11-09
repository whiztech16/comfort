import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import { PrimaryButton } from "../../components/shared/PrimaryButton";
import { useToast } from "../../hooks/useToast";
import {
  getMyProfile,
  isUsernameTaken,
  updateMyProfile,
} from "../../lib/sampleProfiles";

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-navy";

const fieldBase =
  "w-full border bg-[#f1f3fa] text-[0.9rem] text-navy outline-none transition placeholder:text-navy/45 focus:ring-2";

const okBorder = "border-transparent focus:ring-brand/40";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

const errorClass = "mt-2 px-1 text-[0.8125rem] text-[#b4443a]";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const profile = getMyProfile();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [submitted, setSubmitted] = useState(false);

  const errors: { displayName?: string; username?: string } = {};
  if (displayName.trim().length < 2) {
    errors.displayName = "Please enter at least 2 characters.";
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    errors.username = "Use 3 to 20 letters, numbers or underscores.";
  } else if (username !== profile.username && isUsernameTaken(username)) {
    errors.username = "That username is taken.";
  }

  const nameError = submitted ? errors.displayName : undefined;
  const usernameError = submitted ? errors.username : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.displayName || errors.username) return;

    updateMyProfile({
      displayName: displayName.trim(),
      username,
      bio: bio.trim(),
    });
    showToast("Profile updated.");
    navigate("/profile");
  }

  return (
    <div className="space-y-6">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back to Profile
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Edit profile
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          This is what people see when they visit your profile.
        </p>
      </section>

      {/* Initials Avatar Preview (no photo upload) */}
      <div className="flex items-center gap-4 rounded-3xl border border-black/[0.06] bg-[#f8fafd] p-4">
        <Avatar name={displayName || "A"} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1rem] font-semibold text-navy">
            {displayName.trim() || "Your name"}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-navy/55">
            Comfort uses initials to keep things calm and free of photo pressure.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="edit-display-name" className={labelClass}>
            Display name
          </label>
          <input
            id="edit-display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={40}
            autoComplete="nickname"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "edit-display-name-error" : undefined}
            className={`${fieldBase} h-12 rounded-full px-5 ${nameError ? badBorder : okBorder}`}
          />
          {nameError ? (
            <p id="edit-display-name-error" role="alert" className={errorClass}>
              {nameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="edit-username" className={labelClass}>
            Username
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[0.9rem] text-navy/50"
            >
              @
            </span>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(usernameError)}
              aria-describedby={usernameError ? "edit-username-error" : undefined}
              className={`${fieldBase} h-12 rounded-full pl-9 pr-5 ${usernameError ? badBorder : okBorder}`}
            />
          </div>
          {usernameError ? (
            <p id="edit-username-error" role="alert" className={errorClass}>
              {usernameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="edit-bio" className={labelClass}>
            Bio <span className="font-normal text-navy/50">(optional)</span>
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            maxLength={160}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="A line about you"
            className={`${fieldBase} ${okBorder} resize-none rounded-2xl px-5 py-3`}
          />
          <p className="mt-1 px-1 text-right text-[0.75rem] text-navy/50">
            {bio.length}/160
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <PrimaryButton type="submit" className="w-full sm:w-auto">
            Save changes
          </PrimaryButton>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
