import { createHash, randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import { type SQL, and, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { db } from "../../db";
import { passwordResetTokens, profiles, refreshTokens, userSettings, users } from "../../db/schema";
import { sendPasswordResetEmail } from "../../services/email.service";
import { ApiError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { signAccessToken } from "../../utils/jwt";
import type { ChangePasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "./auth.validation";

type Db = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
type PgError = { code?: string; constraint?: string; cause?: PgError };

const ARGON = { type: argon2.argon2id, memoryCost: 47104, timeCost: 2, parallelism: 1 } as const;
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const newToken = () => randomBytes(32).toString("base64url");
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const hash = (p: string) => argon2.hash(p.normalize("NFKC"), ARGON);
const verify = (h: string, p: string) => argon2.verify(h, p.normalize("NFKC")).catch(() => false);
const dummy = hash("timing-equalizer");
const burn = async (p: string) => void (await verify(await dummy, p));
const alert = (event: string, fields: object) => logger.warn({ event, ...fields }, event);

const invalidLogin = () => new ApiError(401, "UNAUTHENTICATED", "Invalid credentials");
const locked = () => new ApiError(429, "ACCOUNT_LOCKED", "Account temporarily locked");
const unavailable = () => new ApiError(403, "FORBIDDEN", "Account unavailable");

const uniqueViolation = (e: unknown): string | null => {
  for (let x = e as PgError | undefined, i = 0; x && i < 3; x = x.cause, i++) {
    if (x.code === "23505") return x.constraint ?? "";
  }
  return null;
};

const revoke = (where: SQL | undefined, x: Db = db) =>
  x
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(where, isNull(refreshTokens.revokedAt)))
    .returning({ id: refreshTokens.id });

const byEmail = async (email: string, x: Db = db, lock = false) => {
  const q = x.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  const [u] = lock ? await q.for("update") : await q;
  return u;
};

async function activeUser(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u || u.status !== "active") throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  return u;
}

function issue(userId: string, familyId: string, refreshToken: string, refreshExpiresAt: Date) {
  const accessToken = signAccessToken({ sub: userId, sid: familyId });
  const claims = jwt.decode(accessToken, { json: true });
  const expiresIn = claims?.exp && claims.iat ? claims.exp - claims.iat : 900;
  return { accessToken, expiresIn, refreshToken, refreshExpiresAt };
}

async function startSession(userId: string, ua: string | undefined, x: Db = db) {
  const familyId = randomUUID();
  const token = newToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  await x.insert(refreshTokens).values({
    userId,
    familyId,
    tokenHash: sha(token),
    deviceLabel: ua?.slice(0, 100) ?? null,
    expiresAt,
  });
  return issue(userId, familyId, token, expiresAt);
}

export async function getCurrentUser(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      emailVerified: sql<boolean>`${users.emailVerifiedAt} is not null`,
      hasPassword: sql<boolean>`${users.passwordHash} is not null`,
      onboardingCompleted: users.onboardingCompleted,
      profile: {
        displayName: profiles.displayName,
        username: profiles.username,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
      },
      settings: {
        notifyNewComforts: userSettings.notifyNewComforts,
        notifyNewMessages: userSettings.notifyNewMessages,
        notifyAppreciation: userSettings.notifyAppreciation,
        appearance: userSettings.appearance,
        allowPrivateMessages: userSettings.allowPrivateMessages,
        discoverableProfile: userSettings.discoverableProfile,
      },
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .innerJoin(userSettings, eq(userSettings.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  if (!row || row.status !== "active") throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  const { status, profile, ...user } = row;
  return {
    ...user,
    profile: profile ?? { displayName: null, username: null, bio: null, avatarUrl: null },
  };
}

const authResult = async (userId: string, ua: string | undefined) => ({
  ...(await startSession(userId, ua)),
  user: await getCurrentUser(userId),
});

async function reserveAttempt(userId: string) {
  const [row] = await db
    .update(users)
    .set({
      failedLoginCount: sql`${users.failedLoginCount} + 1`,
      lockedUntil: sql`case when (${users.failedLoginCount} + 1) % 5 = 0 then now() + make_interval(mins => least(15 * (2 ^ ((${users.failedLoginCount} + 1) / 5 - 1)), 1440)::int) else ${users.lockedUntil} end`,
    })
    .where(and(eq(users.id, userId), sql`(${users.lockedUntil} is null or ${users.lockedUntil} <= now())`))
    .returning({ attempts: users.failedLoginCount });
  return row;
}

const clearFailures = (userId: string) =>
  db.update(users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, userId));

export async function register(i: RegisterInput, ua?: string) {
  const passwordHash = await hash(i.password);
  const userId = await db
    .transaction(async (tx) => {
      const [u] = await tx.insert(users).values({ email: i.email, passwordHash }).returning({ id: users.id });
      await tx.insert(userSettings).values({ userId: u!.id });
      return u!.id;
    })
    .catch((err: unknown) => {
      if (uniqueViolation(err) === null) throw err;
      // Anti-enumeration: Never confirm or deny whether an email is registered
      throw new ApiError(
        409,
        "CONFLICT",
        "Unable to complete registration with the provided information. If you already have an account, please sign in.",
      );
    });
  return authResult(userId, ua);
}

export async function login({ email, password }: LoginInput, ua?: string) {
  const user = await byEmail(email);
  if (!user?.passwordHash || user.status === "deleted") {
    await burn(password);
    throw invalidLogin();
  }
  if (!(await reserveAttempt(user.id))) {
    await burn(password);
    alert("auth.login_locked", { userId: user.id });
    throw locked();
  }
  if (!(await verify(user.passwordHash, password))) {
    alert("auth.login_failed", { userId: user.id });
    throw invalidLogin();
  }
  if (user.status !== "active") throw unavailable();
  await clearFailures(user.id);
  return authResult(user.id, ua);
}

async function googleIdentity(idToken: string) {
  if (!googleClient) throw new ApiError(500, "INTERNAL_ERROR", "Google sign-in is not configured");
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email || p.email_verified !== true || !p.iat) throw new Error("unusable payload");
    return { sub: p.sub, email: p.email.toLowerCase(), name: p.name, iat: p.iat };
  } catch {
    alert("auth.google_rejected", {});
    throw new ApiError(401, "UNAUTHENTICATED", "Invalid Google credential");
  }
}

export async function googleSignIn(idToken: string, ua?: string) {
  const g = await googleIdentity(idToken);

  const resolve = () =>
    db.transaction(async (tx) => {
      const [bySub] = await tx.select().from(users).where(eq(users.googleSub, g.sub)).limit(1);
      const existing = bySub ?? (await byEmail(g.email, tx, true));

      if (existing) {
        if (existing.status !== "active") throw unavailable();
        if (existing.googleSub && existing.googleSub !== g.sub) {
          throw new ApiError(409, "CONFLICT", "Account cannot be linked");
        }
        if (!existing.googleSub) {
          const wipe = !existing.emailVerifiedAt && existing.passwordHash !== null;
          await tx
            .update(users)
            .set({
              googleSub: g.sub,
              emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
              ...(wipe && { passwordHash: null }),
            })
            .where(eq(users.id, existing.id));
          if (wipe) {
            await revoke(eq(refreshTokens.userId, existing.id), tx);
            alert("auth.google_link_wiped_password", { userId: existing.id });
          }
        }
        return existing.id;
      }

      const [u] = await tx
        .insert(users)
        .values({ email: g.email, passwordHash: null, googleSub: g.sub, emailVerifiedAt: new Date() })
        .returning({ id: users.id });
      await tx.insert(userSettings).values({ userId: u!.id });
      return u!.id;
    });

  const userId = await resolve().catch((err: unknown) => {
    if (uniqueViolation(err) === null) throw err;
    return resolve();
  });
  return authResult(userId, ua);
}

export async function refresh(raw: string | undefined) {
  const invalid = new ApiError(401, "TOKEN_INVALID", "Invalid refresh token");
  if (!raw) throw invalid;

  const result = await db.transaction(async (tx) => {
    const [t] = await tx
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, sha(raw)))
      .limit(1)
      .for("update");
    if (!t) return null;

    const dead = t.revokedAt !== null || t.expiresAt <= new Date();
    const [u] = dead ? [] : await tx.select({ status: users.status }).from(users).where(eq(users.id, t.userId));
    if (dead || u?.status !== "active") {
      await revoke(eq(refreshTokens.familyId, t.familyId), tx);
      if (t.revokedAt) alert("auth.refresh_reuse_detected", { userId: t.userId });
      return null;
    }

    const next = newToken();
    const [row] = await tx
      .insert(refreshTokens)
      .values({
        userId: t.userId,
        familyId: t.familyId,
        tokenHash: sha(next),
        deviceLabel: t.deviceLabel,
        expiresAt: t.expiresAt,
      })
      .returning({ id: refreshTokens.id });
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date(), lastUsedAt: new Date(), replacedById: row!.id })
      .where(eq(refreshTokens.id, t.id));
    return issue(t.userId, t.familyId, next, t.expiresAt);
  });

  if (!result) throw invalid;
  return result;
}

export async function logout(raw: string | undefined) {
  if (!raw) return;
  const family = db
    .select({ f: refreshTokens.familyId })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, sha(raw)));
  await revoke(inArray(refreshTokens.familyId, family));
}

export const listSessions = (userId: string) =>
  db
    .select({
      id: refreshTokens.familyId,
      deviceLabel: sql<string | null>`max(${refreshTokens.deviceLabel})`,
      createdAt: sql<string>`min(${refreshTokens.createdAt})`,
      lastUsedAt: sql<string>`max(${refreshTokens.lastUsedAt})`,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId))
    .groupBy(refreshTokens.familyId)
    .having(sql`bool_or(${refreshTokens.revokedAt} is null and ${refreshTokens.expiresAt} > now())`)
    .orderBy(sql`max(${refreshTokens.lastUsedAt}) desc`);

export async function revokeSession(userId: string, familyId: string) {
  const rows = await revoke(and(eq(refreshTokens.userId, userId), eq(refreshTokens.familyId, familyId)));
  if (rows.length === 0) throw new ApiError(404, "NOT_FOUND", "Session not found");
}

async function verifyCurrentPassword(user: { id: string; passwordHash: string | null }, password: string) {
  if (!user.passwordHash) throw new ApiError(400, "PASSWORD_NOT_SET", "No password is set for this account");
  if (!(await reserveAttempt(user.id))) throw locked();
  if (!(await verify(user.passwordHash, password))) {
    alert("auth.bad_current_password", { userId: user.id });
    throw new ApiError(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }
}

export async function changePassword(userId: string, i: ChangePasswordInput, ua?: string) {
  const user = await activeUser(userId);
  await verifyCurrentPassword(user, i.currentPassword);
  const passwordHash = await hash(i.newPassword);
  return db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, userId));
    await revoke(eq(refreshTokens.userId, userId), tx);
    return startSession(userId, ua, tx);
  });
}

export async function assertSensitiveAction(userId: string, proof: { password?: string; idToken?: string }) {
  const user = await activeUser(userId);
  if (proof.password !== undefined) {
    await verifyCurrentPassword(user, proof.password);
    await clearFailures(userId);
    return;
  }
  if (proof.idToken) {
    const g = await googleIdentity(proof.idToken);
    if (g.sub === user.googleSub && Date.now() / 1000 - g.iat <= 300) return;
  }
  throw new ApiError(401, "UNAUTHENTICATED", "Re-authentication required");
}

export async function requestPasswordReset(email: string) {
  const user = await byEmail(email);
  if (user?.status !== "active") return;

  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.userId, user.id), gt(passwordResetTokens.createdAt, new Date(Date.now() - 3_600_000))));
  if ((recent?.n ?? 0) >= 3) return;

  const token = newToken();
  await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
    await tx
      .insert(passwordResetTokens)
      .values({ userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 30 * 60_000) });
  });

  const link = new URL("/reset-password", env.FRONTEND_URL);
  link.hash = `token=${token}`;
  await sendPasswordResetEmail(user.email, link.toString()).catch(() =>
    logger.error({ event: "auth.reset_email_failed", userId: user.id }),
  );
}

export async function resetPassword({ token, password }: ResetPasswordInput) {
  const invalid = new ApiError(400, "INVALID_RESET_TOKEN", "Reset link is invalid or has expired");
  await db.transaction(async (tx) => {
    const [t] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, sha(token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });
    if (!t) throw invalid;

    const [u] = await tx
      .update(users)
      .set({
        passwordHash: await hash(password),
        failedLoginCount: 0,
        lockedUntil: null,
        emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
      })
      .where(and(eq(users.id, t.userId), eq(users.status, "active")))
      .returning({ id: users.id });
    if (!u) throw invalid;
    await revoke(eq(refreshTokens.userId, t.userId), tx);
  });
}