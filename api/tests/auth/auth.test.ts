import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { env } from "../../src/config/env";

// Capture reset emails instead of sending them
const mail = vi.hoisted(() => ({ sent: [] as { to: string; link: string }[] }));
vi.mock("../../src/services/email.service", () => ({
  sendPasswordResetEmail: async (to: string, link: string) => {
    mail.sent.push({ to, link });
  },
}));

// Fake Google verifier: a token is valid only if the test registered its payload
const google = vi.hoisted(() => ({ tokens: new Map<string, Record<string, unknown>>() }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    async verifyIdToken({ idToken }: { idToken: string }) {
      const payload = google.tokens.get(idToken);
      if (!payload) throw new Error("invalid token");
      return { getPayload: () => payload };
    }
  },
}));

import { PASSWORD } from "../helpers/app";
import {
  cookieOf, deleteTestUsers, del, expireRefreshToken, expireResetToken, get, isCleared, login, newEmail, post,
  profileOf, registerAccount, resetRows, setUser, settingsOf, sha256, tokenRows, userRow, type Account,
} from "../helpers/auth";

vi.setConfig({ testTimeout: 90_000, hookTimeout: 90_000 });

const GENERIC_CONFLICT =
  "Unable to complete registration with the provided information. If you already have an account, please sign in.";
const NEW_PASSWORD = "BrandNewPass789!";
const ISSUER = process.env.JWT_ISSUER ?? "comfort-api";
const AUDIENCE = process.env.JWT_AUDIENCE ?? "comfort-web";
const claimsOf = (token: string) => jwt.decode(token, { json: true })!;

// A Google token the fake verifier will accept
function googleToken(over: Record<string, unknown> = {}) {
  const idToken = `google-test-${randomBytes(12).toString("hex")}`;
  const payload = {
    sub: `sub-${randomBytes(8).toString("hex")}`,
    email: newEmail("g"),
    email_verified: true,
    name: "Gee Tester",
    iat: Math.floor(Date.now() / 1000),
    ...over,
  };
  google.tokens.set(idToken, payload);
  return { idToken, payload: payload as { sub: string; email: string } };
}
const googleSignIn = (idToken: string) => post("/auth/google", { idToken });

// Ask for a reset email, wait for the (fire-and-forget) send, return its token
const sentTo = (email: string) => mail.sent.filter((m) => m.to.toLowerCase() === email.toLowerCase());
async function requestReset(email: string) {
  const before = sentTo(email).length;
  const res = await post("/auth/forgot-password", { email });
  expect(res.status).toBe(200);
  await vi.waitFor(() => expect(sentTo(email).length).toBe(before + 1), { timeout: 8_000 });
  const mails = sentTo(email);
  const link = mails[mails.length - 1]!.link;
  return { res, link, token: new URL(link).hash.replace(/^#token=/, "") };
}
const expectNoMail = async (email: string, run: () => Promise<unknown>) => {
  const before = sentTo(email).length;
  await run();
  await new Promise((r) => setTimeout(r, 700));
  expect(sentTo(email).length).toBe(before);
};

afterAll(() => deleteTestUsers());

describe("registration", () => {
  it("creates an account from email and password only", async () => {
    const acct = await registerAccount();
    const { data } = acct.res.body;
    expect(typeof data.accessToken).toBe("string");
    expect(data.expiresIn).toBeGreaterThan(0);
    expect(data.refreshToken).toBeUndefined(); // the refresh token only travels in the cookie
    expect(data.user.email).toBe(acct.email);
    expect(data.user.onboardingCompleted).toBe(false);
    expect(data.user.profile).toEqual({ displayName: null, username: null, bio: null, avatarUrl: null });
    expect(acct.res.text).not.toMatch(/passwordHash|password_hash|googleSub/);
    expect(acct.res.headers["cache-control"]).toContain("no-store");
  });

  it("starts incomplete: no profile row, default settings, Argon2id hash, nothing derived from the email", async () => {
    const email = newEmail("fortune");
    const acct = await registerAccount({ email });
    const row = (await userRow(email))!;
    expect(row.onboardingCompleted).toBe(false);
    expect(row.status).toBe("active");
    expect(row.emailVerifiedAt).toBeNull();
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row.passwordHash).not.toContain(acct.password);

    expect(await profileOf(acct.id)).toBeUndefined(); // no "fortune" display name or username
    const settings = (await settingsOf(acct.id))!;
    expect(settings).toMatchObject({
      notifyNewComforts: true, notifyNewMessages: true, notifyAppreciation: true,
      appearance: "system", allowPrivateMessages: "allowed", discoverableProfile: true,
    });
    const me = await get("/auth/me", { token: acct.token });
    expect(me.body.data.user.profile).toEqual({ displayName: null, username: null, bio: null, avatarUrl: null });
  });

  it("sets an HttpOnly, SameSite=Lax refresh cookie scoped to /api/v1/auth", async () => {
    const acct = await registerAccount();
    const { line } = cookieOf(acct.res)!;
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Lax/i);
    expect(line).toContain("Path=/api/v1/auth");
    expect(acct.cookie).toMatch(/^[A-Za-z0-9_-]{43}$/);
    if (process.env.NODE_ENV === "production") expect(line).toMatch(/Secure/i);
    else expect(line).not.toMatch(/;\s*Secure/i);
    expect(new Date(/Expires=([^;]+)/i.exec(line)![1]!).getTime()).toBeGreaterThan(Date.now() + 86_400_000);
  });

  it("issues an HS256 access token with the expected claims", async () => {
    const acct = await registerAccount();
    expect(jwt.decode(acct.token, { complete: true })!.header.alg).toBe("HS256");
    const claims = claimsOf(acct.token);
    expect(claims.sub).toBe(acct.id);
    expect(claims.sid).toMatch(/^[0-9a-f-]{36}$/);
    expect(claims.iss).toBe(ISSUER);
    expect(claims.aud).toBe(AUDIENCE);
    expect(claims.exp! - claims.iat!).toBe(acct.res.body.data.expiresIn);
  });

  it("stores only a hash of the refresh token", async () => {
    const acct = await registerAccount();
    const rows = await tokenRows(acct.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toBe(sha256(acct.cookie));
    expect(rows[0]!.tokenHash).toHaveLength(64);
    expect(JSON.stringify(rows)).not.toContain(acct.cookie);
    // The lifetime comes from the app's own config, not an assumed number
    const days = env.REFRESH_TOKEN_TTL_DAYS;
    const delta = rows[0]!.expiresAt.getTime() - Date.now();
    expect(Math.abs(delta - days * 86_400_000)).toBeLessThan(86_400_000);
  });

  it("trims and lowercases the email, and treats duplicates case-insensitively", async () => {
    const lower = newEmail("mixed");
    const acct = await registerAccount({ email: `  ${lower.toUpperCase()}  ` });
    expect(acct.res.body.data.user.email).toBe(lower);
    expect((await userRow(lower))!.email).toBe(lower);
    expect((await login(lower, acct.password)).status).toBe(200);
    expect((await post("/auth/register", { email: lower, password: PASSWORD })).status).toBe(409);
  });

  it("accepts passwords of exactly 10 and 128 characters", async () => {
    const short = await post("/auth/register", { email: newEmail("len10"), password: "Abcdefg123" });
    const long = await post("/auth/register", { email: newEmail("len128"), password: "Ab1!".repeat(32) });
    expect(short.status).toBe(201);
    expect(long.status).toBe(201);
  });

  const valid = () => ({ email: newEmail("bad"), password: PASSWORD });
  it.each([
    ["an invalid email", { ...valid(), email: "not-an-email" }],
    ["an over-long email", { ...valid(), email: `${"a".repeat(250)}@x.com` }],
    ["a 9-character password", { ...valid(), password: "Abcdef123" }],
    ["a 129-character password", { ...valid(), password: "a".repeat(129) }],
    ["a non-string password", { ...valid(), password: 1234567890 }],
    ["a missing password", { email: newEmail("bad") }],
    ["a missing email", { password: PASSWORD }],
    ["a displayName", { ...valid(), displayName: "Fortune" }],
    ["a username", { ...valid(), username: "fortune" }],
    ["onboardingCompleted", { ...valid(), onboardingCompleted: true }],
    ["a googleSub", { ...valid(), googleSub: "x" }],
    ["an id", { ...valid(), id: randomUUID() }],
  ])("rejects %s", async (_name, body) => {
    const res = await post("/auth/register", body);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(cookieOf(res)).toBeNull();
    if (typeof (body as { email?: unknown }).email === "string") {
      expect(await userRow((body as { email: string }).email)).toBeUndefined();
    }
  });

  it("answers a duplicate email with a generic conflict and no tokens", async () => {
    const acct = await registerAccount();
    const dup = await post("/auth/register", { email: acct.email.toUpperCase(), password: "AnotherPass456!" });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe("CONFLICT");
    expect(dup.body.message).toBe(GENERIC_CONFLICT);
    expect(dup.body.data).toBeUndefined();
    expect(cookieOf(dup)).toBeNull();
    expect((await login(acct.email, acct.password)).status).toBe(200); // original password untouched
  });

  it("rate limits registration by IP", async () => {
    const ip = "10.250.1.1";
    let limitedAt = 0;
    for (let i = 1; i <= 20 && !limitedAt; i++) {
      const res = await post("/auth/register", {}, { ip });
      if (res.status === 429) limitedAt = i;
      else expect(res.status).toBe(422);
    }
    expect(limitedAt).toBeGreaterThan(1);
    expect(limitedAt).toBeLessThanOrEqual(10);
  });
});

describe("login", () => {
  let acct: Account;
  beforeAll(async () => {
    acct = await registerAccount();
  });

  it("returns tokens and a refresh cookie for the right credentials, whatever the email case", async () => {
    const res = await login(acct.email, acct.password);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(acct.id);
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(cookieOf(res)!.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await login(acct.email.toUpperCase(), acct.password)).status).toBe(200);
  });

  it("gives the same generic 401 for a wrong password and an unknown email", async () => {
    const wrong = await login(acct.email, "WrongPass999!");
    const unknown = await login(newEmail("ghost"), "WrongPass999!");
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHENTICATED");
      expect(cookieOf(res)).toBeNull();
      expect(res.body.data).toBeUndefined();
    }
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it("rejects extra, missing and empty fields", async () => {
    const email = newEmail("shape");
    expect((await post("/auth/login", { email, password: "x", displayName: "A" })).status).toBe(422);
    expect((await post("/auth/login", { email })).status).toBe(422);
    expect((await post("/auth/login", { email, password: "" })).status).toBe(422);
  });

  it("refuses suspended accounts (403) and deleted accounts (401)", async () => {
    const other = await registerAccount();
    await setUser(other.id, { status: "suspended" });
    expect((await login(other.email, other.password)).status).toBe(403);
    await setUser(other.id, { status: "deleted" });
    expect((await login(other.email, other.password)).status).toBe(401);
  });

  it("locks the account after 5 wrong passwords, even for the right one", async () => {
    const lockme = await registerAccount();
    const ip = "10.250.2.1";
    for (let i = 1; i <= 5; i++) {
      expect((await login(lockme.email, "WrongPass999!", { ip })).status, `attempt ${i}`).toBe(401);
    }
    const row = (await userRow(lockme.email))!;
    const minutes = (row.lockedUntil!.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(10);
    expect(minutes).toBeLessThan(20);

    const locked = await login(lockme.email, lockme.password, { ip });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe("ACCOUNT_LOCKED");
    expect(cookieOf(locked)).toBeNull();

    await setUser(lockme.id, { lockedUntil: null, failedLoginCount: 0 }); // what the lock expiring does
    expect((await login(lockme.email, lockme.password, { ip })).status).toBe(200);
  });

  it("resets the failure counter after a successful login", async () => {
    const steady = await registerAccount();
    const ip = "10.250.2.2";
    for (let i = 0; i < 3; i++) expect((await login(steady.email, "WrongPass999!", { ip })).status).toBe(401);
    expect((await login(steady.email, steady.password, { ip })).status).toBe(200);
    expect((await userRow(steady.email))!.failedLoginCount).toBe(0);
    for (let i = 0; i < 4; i++) expect((await login(steady.email, "WrongPass999!", { ip })).status).toBe(401);
    expect((await userRow(steady.email))!.lockedUntil).toBeNull();
  });
});

describe("Google sign-in", () => {
  it("creates a verified account with no profile, and does not use Google's name", async () => {
    const { idToken, payload } = googleToken();
    const res = await googleSignIn(idToken);
    expect(res.status).toBe(200);
    const { user } = res.body.data;
    expect(user.emailVerified).toBe(true);
    expect(user.hasPassword).toBe(false);
    expect(user.onboardingCompleted).toBe(false);
    expect(user.profile).toEqual({ displayName: null, username: null, bio: null, avatarUrl: null });
    expect(JSON.stringify(res.body)).not.toContain("Gee Tester");
    expect(cookieOf(res)).not.toBeNull();

    const row = (await userRow(payload.email))!;
    expect(row.googleSub).toBe(payload.sub);
    expect(row.passwordHash).toBeNull();
    expect(row.emailVerifiedAt).not.toBeNull();
    expect(await profileOf(user.id)).toBeUndefined();
    expect(await settingsOf(user.id)).toBeDefined();
  });

  it("signs the same Google account into the same user every time", async () => {
    const first = googleToken();
    const a = await googleSignIn(first.idToken);
    const second = googleToken({ sub: first.payload.sub, email: first.payload.email });
    const b = await googleSignIn(second.idToken);
    expect(b.status).toBe(200);
    expect(b.body.data.user.id).toBe(a.body.data.user.id);
  });

  it("rejects unverified, incomplete and unknown tokens", async () => {
    const unknown = await googleSignIn("google-test-this-token-was-never-registered");
    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe("Invalid Google credential");
    for (const over of [{ email_verified: false }, { email_verified: undefined }, { sub: undefined }, { email: undefined }]) {
      const res = await googleSignIn(googleToken(over).idToken);
      expect(res.status, JSON.stringify(over)).toBe(401);
      expect(cookieOf(res)).toBeNull();
    }
  });

  it("validates the request body", async () => {
    expect((await post("/auth/google", { idToken: "short" })).status).toBe(422);
    expect((await post("/auth/google", { idToken: googleToken().idToken, extra: 1 })).status).toBe(422);
    expect((await post("/auth/google", {})).status).toBe(422);
  });

  it("links an unverified password account and removes its password", async () => {
    const pw = await registerAccount();
    const { idToken, payload } = googleToken({ email: pw.email });
    const res = await googleSignIn(idToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(pw.id);
    expect(res.body.data.user.hasPassword).toBe(false);
    expect(res.body.data.user.emailVerified).toBe(true);

    const row = (await userRow(pw.email))!;
    expect(row.passwordHash).toBeNull();
    expect(row.googleSub).toBe(payload.sub);
    expect((await login(pw.email, pw.password)).status).toBe(401);
    expect((await post("/auth/refresh", undefined, { cookie: pw.cookie })).status).toBe(401); // old sessions revoked
  });

  it("refuses a different Google account claiming an already-linked email", async () => {
    const first = googleToken();
    expect((await googleSignIn(first.idToken)).status).toBe(200);
    const imposter = googleToken({ email: first.payload.email });
    const res = await googleSignIn(imposter.idToken);
    expect(res.status).toBe(409);
    expect(cookieOf(res)).toBeNull();
  });

  it("refuses suspended Google accounts", async () => {
    const { idToken, payload } = googleToken();
    const first = await googleSignIn(idToken);
    await setUser(first.body.data.user.id, { status: "suspended" });
    expect((await googleSignIn(googleToken({ sub: payload.sub, email: payload.email }).idToken)).status).toBe(403);
  });

  it("lets a Google-only user add a password through forgot-password", async () => {
    const { idToken, payload } = googleToken();
    const signedIn = await googleSignIn(idToken);
    const change = await post(
      "/auth/change-password",
      { currentPassword: "whatever-it-was", newPassword: NEW_PASSWORD },
      { token: signedIn.body.data.accessToken },
    );
    expect(change.status).toBe(400);
    expect(change.body.code).toBe("PASSWORD_NOT_SET");

    const { token } = await requestReset(payload.email);
    expect((await post("/auth/reset-password", { token, password: NEW_PASSWORD })).status).toBe(200);
    const relogin = await login(payload.email, NEW_PASSWORD);
    expect(relogin.status).toBe(200);
    expect(relogin.body.data.user.hasPassword).toBe(true);
  });
});

describe("refresh tokens", () => {
  it("rotates on every refresh and keeps the absolute expiry", async () => {
    const acct = await registerAccount();
    const res = await post("/auth/refresh", undefined, { cookie: acct.cookie });
    expect(res.status).toBe(200);
    const next = cookieOf(res)!.value;
    expect(next).not.toBe(acct.cookie);
    expect(claimsOf(res.body.data.accessToken).sid).toBe(claimsOf(acct.token).sid); // same family
    expect((await get("/auth/me", { token: res.body.data.accessToken })).status).toBe(200);

    const rows = await tokenRows(acct.id);
    expect(rows).toHaveLength(2);
    const oldRow = rows.find((r) => r.tokenHash === sha256(acct.cookie))!;
    const newRow = rows.find((r) => r.tokenHash === sha256(next))!;
    expect(oldRow.revokedAt).not.toBeNull();
    expect(oldRow.replacedById).toBe(newRow.id);
    expect(newRow.revokedAt).toBeNull();
    expect(newRow.expiresAt.getTime()).toBe(oldRow.expiresAt.getTime());
  });

  it("revokes the whole family when an old token is replayed", async () => {
    const acct = await registerAccount();
    const first = await post("/auth/refresh", undefined, { cookie: acct.cookie });
    const second = cookieOf(first)!.value;

    const replay = await post("/auth/refresh", undefined, { cookie: acct.cookie });
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe("TOKEN_INVALID");
    expect(isCleared(replay)).toBe(true);

    expect((await post("/auth/refresh", undefined, { cookie: second })).status).toBe(401); // the thief and the owner both lose
    expect((await tokenRows(acct.id)).every((r) => r.revokedAt !== null)).toBe(true);
  });

  it("rejects missing, malformed, unknown and body-supplied tokens", async () => {
    const missing = await post("/auth/refresh");
    expect(missing.status).toBe(401);
    expect(isCleared(missing)).toBe(true);
    expect((await post("/auth/refresh", undefined, { cookie: "too-short" })).status).toBe(401);
    expect((await post("/auth/refresh", undefined, { cookie: randomBytes(32).toString("base64url") })).status).toBe(401);
    const acct = await registerAccount();
    expect((await post("/auth/refresh", { refreshToken: acct.cookie })).status).toBe(401); // cookie only
  });

  it("rejects expired tokens and revokes their family", async () => {
    const acct = await registerAccount();
    await expireRefreshToken(acct.cookie);
    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
    expect((await tokenRows(acct.id)).every((r) => r.revokedAt !== null)).toBe(true);
  });

  it("stops refreshing for suspended accounts", async () => {
    const acct = await registerAccount();
    await setUser(acct.id, { status: "suspended" });
    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
    expect((await tokenRows(acct.id)).every((r) => r.revokedAt !== null)).toBe(true);
  });
});

describe("logout", () => {
  it("revokes the session and clears the cookie", async () => {
    const acct = await registerAccount();
    const res = await post("/auth/logout", undefined, { cookie: acct.cookie });
    expect(res.status).toBe(200);
    expect(isCleared(res)).toBe(true);
    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
    expect((await tokenRows(acct.id)).every((r) => r.revokedAt !== null)).toBe(true);
  });

  it("only ends that device's session", async () => {
    const acct = await registerAccount();
    const second = await login(acct.email, acct.password);
    const secondCookie = cookieOf(second)!.value;
    expect((await post("/auth/logout", undefined, { cookie: acct.cookie })).status).toBe(200);
    expect((await post("/auth/refresh", undefined, { cookie: secondCookie })).status).toBe(200);
  });

  it("succeeds quietly without a cookie or with a junk one", async () => {
    expect((await post("/auth/logout")).status).toBe(200);
    expect((await post("/auth/logout", undefined, { cookie: "junk" })).status).toBe(200);
  });
});

describe("sessions", () => {
  it("lists active sessions, revokes others, and can revoke the current one", async () => {
    const acct = await registerAccount();
    const second = await login(acct.email, acct.password);
    const secondCookie = cookieOf(second)!.value;
    const sid = claimsOf(acct.token).sid as string;

    const list = await get("/auth/sessions", { token: acct.token });
    expect(list.status).toBe(200);
    const items = list.body.data.items as { id: string; current: boolean }[];
    expect(items).toHaveLength(2);
    expect(items.filter((s) => s.current)).toHaveLength(1);
    expect(items.find((s) => s.current)!.id).toBe(sid);
    expect(list.text).not.toContain(acct.cookie);

    const otherId = items.find((s) => !s.current)!.id;
    expect((await del(`/auth/sessions/${otherId}`, { token: acct.token })).status).toBe(200);
    expect((await post("/auth/refresh", undefined, { cookie: secondCookie })).status).toBe(401);
    expect((await get("/auth/sessions", { token: acct.token })).body.data.items).toHaveLength(1);

    const own = await del(`/auth/sessions/${sid}`, { token: acct.token });
    expect(own.status).toBe(200);
    expect(isCleared(own)).toBe(true);
    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
  });

  it("hides other people's sessions and validates ids", async () => {
    const a = await registerAccount();
    const b = await registerAccount();
    const sidA = claimsOf(a.token).sid as string;
    expect((await del(`/auth/sessions/${sidA}`, { token: b.token })).status).toBe(404);
    expect((await get("/auth/sessions", { token: a.token })).body.data.items).toHaveLength(1);
    expect((await del(`/auth/sessions/${randomUUID()}`, { token: a.token })).status).toBe(404);
    expect((await del("/auth/sessions/not-a-uuid", { token: a.token })).status).toBe(422);
    expect((await get("/auth/sessions")).status).toBe(401);
    expect((await del(`/auth/sessions/${sidA}`)).status).toBe(401);
  });
});

describe("change password", () => {
  it("rejects bad requests and leaves the password unchanged", async () => {
    const acct = await registerAccount();
    const change = (body: object, token = acct.token) => post("/auth/change-password", body, { token });
    const wrong = await change({ currentPassword: "WrongPass999!", newPassword: NEW_PASSWORD });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("INVALID_CURRENT_PASSWORD");
    expect((await change({ currentPassword: acct.password, newPassword: acct.password })).status).toBe(422);
    expect((await change({ currentPassword: acct.password, newPassword: "short" })).status).toBe(422);
    expect((await change({ currentPassword: acct.password, newPassword: NEW_PASSWORD, userId: acct.id })).status).toBe(422);
    expect((await post("/auth/change-password", { currentPassword: "a", newPassword: NEW_PASSWORD })).status).toBe(401);
    expect((await login(acct.email, acct.password)).status).toBe(200);
  });

  it("changes the password, revokes every old session and starts a new one", async () => {
    const acct = await registerAccount();
    const res = await post(
      "/auth/change-password",
      { currentPassword: acct.password, newPassword: NEW_PASSWORD },
      { token: acct.token },
    );
    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe("string");
    const fresh = cookieOf(res)!.value;
    expect(fresh).not.toBe(acct.cookie);

    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
    expect((await login(acct.email, acct.password)).status).toBe(401);
    expect((await login(acct.email, NEW_PASSWORD)).status).toBe(200);
    expect((await post("/auth/refresh", undefined, { cookie: fresh })).status).toBe(200);
    expect((await userRow(acct.email))!.failedLoginCount).toBe(0);
  });
});

describe("forgot and reset password", () => {
  let acct: Account;
  let reset: Awaited<ReturnType<typeof requestReset>>;
  beforeAll(async () => {
    acct = await registerAccount();
    await setUser(acct.id, { failedLoginCount: 4, lockedUntil: new Date(Date.now() + 10 * 60_000) });
    reset = await requestReset(acct.email);
  });

  it("emails a link whose token is in the URL fragment, not the query string", () => {
    const url = new URL(reset.link);
    expect(url.pathname).toBe("/reset-password");
    expect(url.search).toBe("");
    expect(url.hash).toMatch(/^#token=[A-Za-z0-9_-]{43}$/);
    expect(url.origin).toBe(new URL(process.env.FRONTEND_URL ?? "http://localhost:5173").origin);
  });

  it("stores only the token's hash, valid for about 30 minutes", async () => {
    const rows = await resetRows(acct.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toBe(sha256(reset.token));
    expect(JSON.stringify(rows)).not.toContain(reset.token);
    expect(rows[0]!.usedAt).toBeNull();
    const minutes = (rows[0]!.expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(28);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it("answers unknown emails exactly like known ones, and sends nothing", async () => {
    const ghost = newEmail("ghost");
    await expectNoMail(ghost, async () => {
      const res = await post("/auth/forgot-password", { email: ghost });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(reset.res.body);
    });
  });

  it("validates reset requests", async () => {
    const good = randomBytes(32).toString("base64url");
    expect((await post("/auth/reset-password", { token: "short", password: NEW_PASSWORD })).status).toBe(422);
    expect((await post("/auth/reset-password", { token: good })).status).toBe(422);
    expect((await post("/auth/reset-password", { token: good, password: "short" })).status).toBe(422);
    const unknown = await post("/auth/reset-password", { token: good, password: NEW_PASSWORD });
    expect(unknown.status).toBe(400);
    expect(unknown.body.code).toBe("INVALID_RESET_TOKEN");
  });

  it("resets the password, unlocks the account and revokes old sessions", async () => {
    const res = await post("/auth/reset-password", { token: reset.token, password: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect(isCleared(res)).toBe(true);

    const row = (await userRow(acct.email))!;
    expect(row.failedLoginCount).toBe(0);
    expect(row.lockedUntil).toBeNull();
    expect(row.emailVerifiedAt).not.toBeNull();
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);

    expect((await login(acct.email, acct.password)).status).toBe(401);
    expect((await login(acct.email, NEW_PASSWORD)).status).toBe(200);
    expect((await post("/auth/refresh", undefined, { cookie: acct.cookie })).status).toBe(401);
    expect((await resetRows(acct.id))[0]!.usedAt).not.toBeNull();
  });

  it("cannot reuse a token", async () => {
    const again = await post("/auth/reset-password", { token: reset.token, password: "YetAnotherPass321!" });
    expect(again.status).toBe(400);
    expect(again.body.code).toBe("INVALID_RESET_TOKEN");
  });

  it("invalidates an older token when a new one is requested", async () => {
    const other = await registerAccount();
    const first = await requestReset(other.email);
    const second = await requestReset(other.email);
    expect((await post("/auth/reset-password", { token: first.token, password: NEW_PASSWORD })).status).toBe(400);
    expect((await post("/auth/reset-password", { token: second.token, password: NEW_PASSWORD })).status).toBe(200);
  });

  it("rejects an expired token", async () => {
    const other = await registerAccount();
    const { token } = await requestReset(other.email);
    await expireResetToken(token);
    const res = await post("/auth/reset-password", { token, password: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_RESET_TOKEN");
    expect((await login(other.email, other.password)).status).toBe(200); // password untouched
  });

  it("sends no email for suspended accounts", async () => {
    const other = await registerAccount();
    await setUser(other.id, { status: "suspended" });
    await expectNoMail(other.email, async () => {
      expect((await post("/auth/forgot-password", { email: other.email })).status).toBe(200);
    });
  });
});

describe("current user and access tokens", () => {
  it("returns the account, profile, settings and onboarding state, without secrets", async () => {
    const acct = await registerAccount();
    const res = await get("/auth/me", { token: acct.token });
    expect(res.status).toBe(200);
    const { user } = res.body.data;
    expect(user).toMatchObject({
      id: acct.id, email: acct.email, emailVerified: false, hasPassword: true, onboardingCompleted: false,
    });
    expect(user.settings).toEqual({
      notifyNewComforts: true, notifyNewMessages: true, notifyAppreciation: true,
      appearance: "system", allowPrivateMessages: "allowed", discoverableProfile: true,
    });
    expect(res.text).not.toMatch(/passwordHash|googleSub|"status"/);
  });

  it("rejects suspended and deleted accounts even with a valid token", async () => {
    const acct = await registerAccount();
    await setUser(acct.id, { status: "suspended" });
    expect((await get("/auth/me", { token: acct.token })).status).toBe(401);
    await setUser(acct.id, { status: "deleted" });
    expect((await get("/auth/me", { token: acct.token })).status).toBe(401);
  });

  it("rejects expired, wrongly signed, wrong-issuer, wrong-audience and non-HS256 tokens", async () => {
    const acct = await registerAccount();
    const secret = process.env.JWT_ACCESS_SECRET!;
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: acct.id, sid: randomUUID() };
    const sign = (over: { secret?: string; alg?: jwt.Algorithm; iss?: string; aud?: string; exp?: number } = {}) =>
      jwt.sign({ ...claims, iat: now - 120, exp: over.exp ?? now + 600 }, over.secret ?? secret, {
        algorithm: over.alg ?? "HS256",
        issuer: over.iss ?? ISSUER,
        audience: over.aud ?? AUDIENCE,
      });

    const expired = await get("/auth/me", { token: sign({ exp: now - 60 }) });
    expect(expired.status).toBe(401);
    expect(expired.body.code).toBe("TOKEN_EXPIRED"); // the frontend refreshes on exactly this code
    for (const token of [
      sign({ secret: "x".repeat(40) }),
      sign({ iss: "someone-else" }),
      sign({ aud: "another-app" }),
      sign({ alg: "HS512" }),
    ]) {
      expect((await get("/auth/me", { token })).status).toBe(401);
    }
  });
});