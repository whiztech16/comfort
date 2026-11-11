import { ApiError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { emitToUser } from "../../sockets/emitter";
import * as repo from "./keys.repository";

const LINK_TTL_MS = 5 * 60 * 1000;
const BACKUP_FORMAT_VERSION = 1; // secretbox format; set by the server, not the client

const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `${what} not found`);

// Backups and link requests only make sense once the account key exists
async function requireAccountKey(userId: string) {
  if (!(await repo.findPublicKey(userId))) {
    throw new ApiError(409, "CONFLICT", "Set up your account key first");
  }
}

export async function setAccountKey(userId: string, publicKey: string) {
  const created = await repo.insertPublicKey(userId, publicKey);
  if (created) return { key: created, created: true };

  // Same key again is fine; a different one would orphan every message
  const existing = await repo.findPublicKey(userId);
  if (existing?.publicKey === publicKey) return { key: existing, created: false };
  throw new ApiError(409, "KEY_ALREADY_REGISTERED", "An account key is already set");
}

export async function getAccountKey(userId: string) {
  const key = await repo.findPublicKey(userId);
  if (!key) throw notFound("Account key");
  return key;
}

export async function putBackup(
  userId: string,
  data: { encryptedPrivateKey: string; nonce: string; kdfSalt: string },
) {
  await requireAccountKey(userId);
  return repo.upsertBackup(userId, { ...data, version: BACKUP_FORMAT_VERSION });
}

export async function getBackup(userId: string) {
  const backup = await repo.findBackup(userId);
  if (!backup) throw notFound("Backup");
  return backup;
}

export async function createLinkRequest(userId: string, ephemeralPublicKey: string) {
  await requireAccountKey(userId);
  return repo.createLinkRequest(userId, ephemeralPublicKey, new Date(Date.now() + LINK_TTL_MS));
}

// Polled by the NEW device only; the first read after approval burns the payload
export async function getLinkRequest(userId: string, id: string) {
  const row = await repo.findLinkRequest(id, userId);
  if (!row) throw notFound("Link request");

  const open = row.status === "pending" || row.status === "approved";
  if (open && row.expiresAt <= new Date()) {
    await repo.expireLinkRequest(id);
    return { status: "expired" as const };
  }
  if (row.status === "pending") return { status: "pending" as const, expiresAt: row.expiresAt };
  if (row.status === "approved") {
    const payload = await repo.consumeLinkRequest(id, userId);
    // null means another poll got there first
    if (!payload) return { status: "consumed" as const };
    return { status: "approved" as const, encryptedPayload: payload };
  }
  return { status: row.status };
}

// Called by the OLD device after the user confirms the fingerprints match
export async function approveLinkRequest(userId: string, id: string, encryptedPayload: string) {
  if (await repo.approveLinkRequest(id, userId, encryptedPayload)) {
    logger.info({ event: "keys.link_approved", userId });
    emitToUser(userId, "keys:link-approved", { id });
    return;
  }
  if (!(await repo.findLinkRequest(id, userId))) throw notFound("Link request");
  throw new ApiError(409, "CONFLICT", "This link request is no longer pending");
}