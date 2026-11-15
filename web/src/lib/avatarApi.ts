import { apiRequest, getUser, setUser } from "./api";

const AVATAR_PATH = "/api/v1/users/me/avatar";
const UPLOAD_METHOD = "POST";
const USER_UPDATED_EVENT = "comfort:user-updated";

const MAX_SIDE = 1024;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface AvatarProfile {
  displayName: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export class AvatarInputError extends Error {}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

export async function prepareAvatar(file: File): Promise<Blob> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AvatarInputError("Use a JPEG, PNG or WebP image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new AvatarInputError("That image is too large. Choose one under 15 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(file);
  } catch {
    throw new AvatarInputError("That image couldn’t be opened. Try a different one.");
  }

  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new AvatarInputError("Your browser can’t process this image.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new AvatarInputError("That image couldn’t be processed.");
    return blob;
  } finally {
    bitmap.close();
  }
}

function syncStoredProfile(profile: AvatarProfile) {
  const user = getUser();
  if (!user) return;
  setUser({ ...user, profile: { ...user.profile, ...profile } });
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}

export async function uploadAvatarApi(image: Blob): Promise<AvatarProfile> {
  const form = new FormData();
  form.append("avatar", image, "avatar.jpg");
  const res = await apiRequest<{ profile: AvatarProfile }>(AVATAR_PATH, {
    method: UPLOAD_METHOD,
    body: form,
  });
  const profile = res.data?.profile;
  if (!profile) throw new Error("Unexpected response from the server");
  syncStoredProfile(profile);
  return profile;
}

export async function removeAvatarApi(): Promise<AvatarProfile> {
  const res = await apiRequest<{ profile: AvatarProfile }>(AVATAR_PATH, { method: "DELETE" });
  const profile = res.data?.profile;
  if (!profile) throw new Error("Unexpected response from the server");
  syncStoredProfile(profile);
  return profile;
}