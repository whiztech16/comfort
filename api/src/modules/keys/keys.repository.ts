import { and, eq, gt, inArray } from "drizzle-orm";
import { db } from "../../db";
import { deviceLinkRequests, keyBackups, userKeys } from "../../db/schema";

const linkColumns = {
  id: deviceLinkRequests.id,
  status: deviceLinkRequests.status,
  expiresAt: deviceLinkRequests.expiresAt,
};

// Returns the new row, or null if a key already exists
export async function insertPublicKey(userId: string, publicKey: string) {
  const [row] = await db
    .insert(userKeys)
    .values({ userId, publicKey })
    .onConflictDoNothing({ target: userKeys.userId })
    .returning({ publicKey: userKeys.publicKey, createdAt: userKeys.createdAt });
  return row ?? null;
}

export async function findPublicKey(userId: string) {
  const [row] = await db
    .select({ publicKey: userKeys.publicKey, createdAt: userKeys.createdAt })
    .from(userKeys)
    .where(eq(userKeys.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertBackup(
  userId: string,
  data: { encryptedPrivateKey: string; nonce: string; kdfSalt: string; version: number },
) {
  const [row] = await db
    .insert(keyBackups)
    .values({ userId, ...data })
    .onConflictDoUpdate({ target: keyBackups.userId, set: { ...data, updatedAt: new Date() } })
    .returning({ version: keyBackups.version, updatedAt: keyBackups.updatedAt });
  return row!;
}

export async function findBackup(userId: string) {
  const [row] = await db
    .select({
      encryptedPrivateKey: keyBackups.encryptedPrivateKey,
      nonce: keyBackups.nonce,
      kdfSalt: keyBackups.kdfSalt,
      version: keyBackups.version,
      updatedAt: keyBackups.updatedAt,
    })
    .from(keyBackups)
    .where(eq(keyBackups.userId, userId))
    .limit(1);
  return row ?? null;
}

// A new request retires any older open one, so only one can be live per user
export function createLinkRequest(userId: string, ephemeralPublicKey: string, expiresAt: Date) {
  return db.transaction(async (tx) => {
    await tx
      .update(deviceLinkRequests)
      .set({ status: "expired", encryptedPayload: null })
      .where(and(eq(deviceLinkRequests.userId, userId), inArray(deviceLinkRequests.status, ["pending", "approved"])));
    const [row] = await tx
      .insert(deviceLinkRequests)
      .values({ userId, ephemeralPublicKey, expiresAt })
      .returning({ id: deviceLinkRequests.id, expiresAt: deviceLinkRequests.expiresAt });
    return row!;
  });
}

export async function findLinkRequest(id: string, userId: string) {
  const [row] = await db
    .select(linkColumns)
    .from(deviceLinkRequests)
    .where(and(eq(deviceLinkRequests.id, id), eq(deviceLinkRequests.userId, userId)))
    .limit(1);
  return row ?? null;
}

// Only a live pending request can be approved, and only once
export async function approveLinkRequest(id: string, userId: string, encryptedPayload: string) {
  const rows = await db
    .update(deviceLinkRequests)
    .set({ status: "approved", encryptedPayload })
    .where(
      and(
        eq(deviceLinkRequests.id, id),
        eq(deviceLinkRequests.userId, userId),
        eq(deviceLinkRequests.status, "pending"),
        gt(deviceLinkRequests.expiresAt, new Date()),
      ),
    )
    .returning({ id: deviceLinkRequests.id });
  return rows.length > 0;
}

// Returns the payload to the first caller only, then wipes it
export function consumeLinkRequest(id: string, userId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ payload: deviceLinkRequests.encryptedPayload })
      .from(deviceLinkRequests)
      .where(
        and(
          eq(deviceLinkRequests.id, id),
          eq(deviceLinkRequests.userId, userId),
          eq(deviceLinkRequests.status, "approved"),
          gt(deviceLinkRequests.expiresAt, new Date()),
        ),
      )
      .for("update")
      .limit(1);
    if (!row?.payload) return null;
    await tx
      .update(deviceLinkRequests)
      .set({ status: "consumed", encryptedPayload: null })
      .where(eq(deviceLinkRequests.id, id));
    return row.payload;
  });
}

// Expired requests lose any payload they were holding
export async function expireLinkRequest(id: string) {
  await db
    .update(deviceLinkRequests)
    .set({ status: "expired", encryptedPayload: null })
    .where(and(eq(deviceLinkRequests.id, id), inArray(deviceLinkRequests.status, ["pending", "approved"])));
}