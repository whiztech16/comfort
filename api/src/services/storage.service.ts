import { randomBytes } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { ApiError } from "../shared/errors";

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Uploads an already-processed image under a random, unguessable ID
export function uploadAvatar(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  if (!configured) throw new ApiError(500, "INTERNAL_ERROR", "Avatar uploads aren't configured");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "comfort/avatars", public_id: randomBytes(16).toString("hex"), resource_type: "image", overwrite: false },
      (err, result) =>
        err || !result
          ? reject(new Error(err ? err.message : "Upload failed"))
          : resolve({ url: result.secure_url, publicId: result.public_id }),
    );
    stream.end(buffer);
  });
}

export async function deleteAvatar(publicId: string): Promise<void> {
  if (!configured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
}