import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import ProfileAvatar from "../profile/ProfileAvatar";
import { getUser } from "../../lib/api";

export default function ComposerPrompt({ name }: Readonly<{ name: string }>) {
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();
  const photoUrl = getUser()?.profile?.avatarUrl ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/posts/new", { state: { draft: draft.trim() } });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="liquid-glass flex items-center gap-3 rounded-full p-2 focus-within:ring-2 focus-within:ring-brand/40"
    >
      <ProfileAvatar name={name} photoUrl={photoUrl} size="sm" />

      <label htmlFor="composer" className="sr-only">
        Share something
      </label>
      <input
        id="composer"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={2000}
        placeholder="Share something…"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-navy outline-none placeholder:text-navy/50"
      />

      <button
        type="submit"
        aria-label="Continue to create post"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <Send aria-hidden className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  );
}