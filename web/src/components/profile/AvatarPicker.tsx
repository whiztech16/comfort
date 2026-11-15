import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, Trash2 } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { useToast } from "../../hooks/useToast";
import { AvatarInputError, prepareAvatar, removeAvatarApi, uploadAvatarApi } from "../../lib/avatarApi";

type Props = Readonly<{
  name: string;
  photoUrl: string | null;
  onChange?: (url: string | null) => void;
}>;

const buttonClass =
  "inline-flex h-10 items-center gap-2 rounded-full bg-[#f1f3fa] px-4 text-[0.8125rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-60";

function errorText(err: unknown): string {
  if (err instanceof AvatarInputError) return err.message;
  const e = err as { status?: number; message?: string; errors?: { message?: string }[] } | null;
  if (!e?.status) return "Check your connection and try again.";
  if (e.status === 422) return e.errors?.[0]?.message || "That image couldn’t be used.";
  if (e.status === 413) return "That image is too large.";
  if (e.status === 429) return "Too many uploads. Please try again later.";
  return e.message || "We couldn’t update your photo. Please try again.";
}

export default function AvatarPicker({ name, photoUrl, onChange }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(photoUrl);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still triggers a change
    event.target.value = "";
    if (!file || busy) return;

    setError(null);
    setBusy("upload");
    try {
      const image = await prepareAvatar(file);
      const profile = await uploadAvatarApi(image);
      setUrl(profile.avatarUrl);
      onChange?.(profile.avatarUrl);
      showToast("Photo updated.");
    } catch (err: unknown) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setError(null);
    setBusy("remove");
    try {
      await removeAvatarApi();
      setUrl(null);
      onChange?.(null);
      showToast("Photo removed.");
    } catch (err: unknown) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar name={name} photoUrl={url} />

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className={buttonClass}
          >
            <Camera aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            {busy === "upload" ? "Uploading…" : url ? "Change photo" : "Add photo"}
          </button>
          {url ? (
            <button type="button" onClick={() => void handleRemove()} disabled={busy !== null} className={buttonClass}>
              <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              {busy === "remove" ? "Removing…" : "Remove"}
            </button>
          ) : null}
        </div>

        <p className="text-[0.75rem] text-navy/55">JPEG, PNG or WebP. Saved as soon as you choose it.</p>
        {error ? (
          <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
            {error}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void handleFile(e)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}