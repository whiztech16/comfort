import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import ProfileAvatar from "./ProfileAvatar";

type PhotoPickerProps = Readonly<{
  name: string;
  currentUrl: string | null; // the photo saved on the profile
  file: File | null; // a newly chosen photo, not saved yet
  removed: boolean; // the saved photo was removed, not saved yet
  onFile: (file: File) => void;
  onRemove: () => void;
}>;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const buttonClass =
  "inline-flex h-9 cursor-pointer items-center rounded-full bg-[#f1f3fa] px-4 text-[0.8125rem] font-medium text-navy transition hover:bg-[#e8ecf7] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-deep";

export default function PhotoPicker({
  name,
  currentUrl,
  file,
  removed,
  onFile,
  onRemove,
}: PhotoPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview of a newly chosen photo. The temporary URL is released when it changes.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shownUrl = previewUrl ?? (removed ? null : currentUrl);
  const hasPhoto = Boolean(shownUrl);

  // These checks are a convenience only. The server must validate the file itself.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = ""; // lets the same file be chosen again
    if (!chosen) return;

    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (chosen.size > MAX_PHOTO_BYTES) {
      setError("That photo is over 5 MB. Please choose a smaller one.");
      return;
    }
    setError(null);
    onFile(chosen);
  }

  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar name={name} photoUrl={shownUrl} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="peer sr-only"
          />
          <label htmlFor="profile-photo" className={buttonClass}>
            {hasPhoto ? "Change photo" : "Upload photo"}
          </label>

          {hasPhoto ? (
            <button
              type="button"
              onClick={onRemove}
              className="h-9 rounded-full px-3 text-[0.8125rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
            >
              Remove
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-[0.8125rem] leading-snug text-navy/60">
          JPG, PNG or WebP, up to 5 MB. We’ll use your first initial if you skip it.
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-[0.8125rem] text-[#b4443a]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}