import { ApiError } from "../../shared/errors";
import type { UpdateProfileInput, UpdateSettingsInput } from "./users.validation";
import * as repo from "./users.repository";

const notFound = () => new ApiError(404, "NOT_FOUND", "User not found");

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function getPublicProfile(viewerId: string, username: string) {
  const p = await repo.findPublicProfile(username, viewerId);
  if (!p) throw notFound();

  const isSelf = p.userId === viewerId;
  if (!isSelf && !p.discoverable) throw notFound();

  return {
    displayName: p.displayName,
    username: p.username,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    isSelf,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const patch: { displayName?: string; username?: string; bio?: string | null } = {};
  if (input.displayName !== undefined) patch.displayName = input.displayName;
  if (input.username !== undefined) patch.username = input.username;
  if (input.bio !== undefined) patch.bio = input.bio === "" ? null : input.bio;

  try {
    const row = await repo.updateProfile(userId, patch);
    if (!row) throw notFound();
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "CONFLICT", "Username is already taken", [
        { path: "username", message: "Username is unavailable" },
      ]);
    }
    throw err;
  }
}

export async function getSettings(userId: string) {
  const row = await repo.getSettings(userId);
  if (!row) throw notFound();
  return row;
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  const row = await repo.updateSettings(userId, input);
  if (!row) throw notFound();
  return row;
}