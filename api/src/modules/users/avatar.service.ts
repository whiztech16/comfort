import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { deleteAvatar, uploadAvatar } from "../../services/storage.service";
import { ApiError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { replaceAvatar } from "./avatar.repository";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PIXELS = 25_000_000; // blocks decompression bombs

const badImage = (message: string) =>
  new ApiError(422, "VALIDATION_ERROR", "Invalid request", [{ path: "avatar", message }]);

// Best-effort cleanup: a failure is logged, never shown to the user
const discard = (publicId: string) =>
  deleteAvatar(publicId).catch(() => logger.warn({ event: "avatar.cleanup_failed", publicId }));

async function processAvatar(input: Buffer): Promise<Buffer> {
  // Trust the file's bytes, not its name or declared type
  const type = await fileTypeFromBuffer(input);
  if (!type || !ALLOWED.has(type.mime)) throw badImage("Use a JPEG, PNG or WebP image");
  try {
    return await sharp(input, { limitInputPixels: MAX_PIXELS })
      .rotate() // apply EXIF orientation first; the metadata is dropped on re-encode
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw badImage("That image couldn't be processed");
  }
}

export async function setAvatar(userId: string, input: Buffer) {
  const webp = await processAvatar(input);
  const uploaded = await uploadAvatar(webp);

  let result;
  try {
    result = await replaceAvatar(userId, uploaded.url, uploaded.publicId);
  } catch (err) {
    await discard(uploaded.publicId);
    throw err;
  }
  if (!result) {
    await discard(uploaded.publicId);
    throw new ApiError(404, "NOT_FOUND", "Profile not found");
  }
  if (result.oldPublicId) await discard(result.oldPublicId);
  return result.profile;
}

export async function removeAvatar(userId: string) {
  const result = await replaceAvatar(userId, null, null);
  if (!result) throw new ApiError(404, "NOT_FOUND", "Profile not found");
  if (result.oldPublicId) await discard(result.oldPublicId);
  return result.profile;
}