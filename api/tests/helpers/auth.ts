import { createHash, randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import request from "supertest";
import { db } from "../../src/db";
import { passwordResetTokens, profiles, refreshTokens, userSettings, users } from "../../src/db/schema";
import { ORIGIN, PASSWORD, app, randomIp } from "./app";

export const TEST_DOMAIN = "authtest.example.com";
export const COOKIE = process.env.REFRESH_COOKIE_NAME ?? "comfort_rt";

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const newEmail = (label = "user") => `${label}-${randomBytes(4).toString("hex")}@${TEST_DOMAIN}`;

type Opts = { ip?: string; cookie?: string; token?: string };

// Every request gets Origin and a fresh fake IP, so per-IP rate limits never collide
function headers(opts: Opts) {
  const h: Record<string, string> = { Origin: ORIGIN, "X-Forwarded-For": opts.ip ?? randomIp() };
  if (opts.token) h.Authorization = `Bearer ${opts.token}`;
  if (opts.cookie) h.Cookie = `${COOKIE}=${opts.cookie}`;
  return h;
}

export const post = (path: string, body?: object, opts: Opts = {}) => {
  const req = request(app).post(`/api/v1${path}`).set(headers(opts));
  return body === undefined ? req : req.send(body);
};
export const get = (path: string, opts: Opts = {}) => request(app).get(`/api/v1${path}`).set(headers(opts));
export const del = (path: string, opts: Opts = {}) => request(app).delete(`/api/v1${path}`).set(headers(opts));

// The refresh cookie from a response: its raw Set-Cookie line and value
export function cookieOf(res: { headers: object }) {
  const lines = ((res.headers as Record<string, unknown>)["set-cookie"] as string[] | undefined) ?? [];
  const line = lines.find((c) => c.startsWith(`${COOKIE}=`));
  return line ? { line, value: line.split(";")[0]!.slice(COOKIE.length + 1) } : null;
}

// Express clears a cookie by sending it empty and expired
export const isCleared = (res: { headers: object }) => cookieOf(res)?.value === "";

export const login = (email: string, password: string, opts: Opts = {}) => post("/auth/login", { email, password }, opts);

export async function registerAccount(opts: { email?: string; password?: string } = {}) {
  const email = opts.email ?? newEmail();
  const password = opts.password ?? PASSWORD;
  const res = await post("/auth/register", { email, password });
  if (res.status !== 201) throw new Error(`register: expected 201, got ${res.status} ${res.text}`);
  return {
    res,
    email,
    password,
    id: res.body.data.user.id as string,
    token: res.body.data.accessToken as string,
    cookie: cookieOf(res)!.value,
  };
}

export type Account = Awaited<ReturnType<typeof registerAccount>>;

// Direct database reads and edits, to check what the API can't show
export const userRow = async (email: string) => {
  const [row] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
  return row;
};
export const profileOf = async (userId: string) => {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row;
};
export const settingsOf = async (userId: string) => {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return row;
};
export const tokenRows = (userId: string) => db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId));
export const resetRows = (userId: string) =>
  db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

export const setUser = (id: string, values: Partial<typeof users.$inferInsert>) =>
  db.update(users).set(values).where(eq(users.id, id));
export const expireRefreshToken = (cookie: string) =>
  db.update(refreshTokens).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(refreshTokens.tokenHash, sha256(cookie)));
export const expireResetToken = (token: string) =>
  db.update(passwordResetTokens).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(passwordResetTokens.tokenHash, sha256(token)));

// Everything these tests create uses one email domain; cascades remove the rest
export const deleteTestUsers = () => db.delete(users).where(sql`${users.email} like ${`%@${TEST_DOMAIN}`}`);