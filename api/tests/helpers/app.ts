import { randomBytes } from "node:crypto";
import { inArray } from "drizzle-orm";
import request from "supertest";
import { createApp } from "../../src/app";
import { db } from "../../src/db";
import { categories, users } from "../../src/db/schema";

export const app = createApp();
export const ORIGIN = new URL(process.env.FRONTEND_URL ?? "http://localhost:5173").origin;
export const PASSWORD = "StrongPass123!";

const b64 = (n: number) => randomBytes(n).toString("base64");
const octet = () => 1 + Math.floor(Math.random() * 254);
export const randomIp = () => `10.${octet()}.${octet()}.${octet()}`;

export type TestUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  token: string;
  ip: string;
};

// Throws with the response body, so a failed step explains itself
export function expectStatus<T extends { status: number; text: string }>(res: T, status: number, label: string): T {
  if (res.status !== status) throw new Error(`${label}: expected ${status}, got ${res.status} ${res.text}`);
  return res;
}

// Real register, onboarding and key upload, so tests exercise the real auth path
export async function createUser(label: string, opts: { onboard?: boolean } = {}): Promise<TestUser> {
  const tag = randomBytes(4).toString("hex");
  const ip = randomIp();
  const email = `${label}-${tag}@example.com`;
  const username = `${label}_${tag}`;
  const displayName = `${label} ${tag}`;
  const base = { Origin: ORIGIN, "X-Forwarded-For": ip };

  const reg = expectStatus(
    await request(app).post("/api/v1/auth/register").set(base).send({ email, password: PASSWORD }),
    201,
    `register ${label}`,
  );
  const user: TestUser = {
    id: reg.body.data.user.id,
    email,
    username,
    displayName,
    token: reg.body.data.accessToken,
    ip,
  };

  if (opts.onboard !== false) {
    const auth = { ...base, Authorization: `Bearer ${user.token}` };
    expectStatus(
      await request(app)
        .post("/api/v1/users/onboarding")
        .set(auth)
        .send({ displayName, username, discoverableProfile: true, allowPrivateMessages: "allowed" }),
      200,
      `onboard ${label}`,
    );
    expectStatus(
      await request(app).put("/api/v1/keys/account").set(auth).send({ publicKey: b64(32) }),
      201,
      `keys ${label}`,
    );
  }
  return user;
}

type Method = "get" | "post" | "put" | "patch" | "delete";
const call = (user: TestUser, method: Method) => (path: string) =>
  request(app)[method](`/api/v1${path}`).set({
    Authorization: `Bearer ${user.token}`,
    Origin: ORIGIN,
    "X-Forwarded-For": user.ip,
  });

// as(user).post("/posts").send({...})
export const as = (user: TestUser) => ({
  get: call(user, "get"),
  post: call(user, "post"),
  put: call(user, "put"),
  patch: call(user, "patch"),
  delete: call(user, "delete"),
});

export const encryptedMessage = () => ({
  ciphertext: b64(40),
  nonce: b64(24),
  senderWrappedKey: b64(80),
  recipientWrappedKey: b64(80),
});

export async function createCategory() {
  const tag = randomBytes(4).toString("hex");
  const [row] = await db
    .insert(categories)
    .values({ name: `Test ${tag}`, slug: `test-${tag}` })
    .returning({ id: categories.id, slug: categories.slug });
  return row!;
}

// Deleting users cascades to their posts, Comforts, conversations and so on
export async function cleanup(people: (TestUser | undefined)[], categoryIds: string[]) {
  const validPeople = people.filter((p): p is TestUser => Boolean(p?.id));
  if (validPeople.length) await db.delete(users).where(inArray(users.id, validPeople.map((p) => p.id)));
  const validCategoryIds = categoryIds.filter(Boolean);
  if (validCategoryIds.length) await db.delete(categories).where(inArray(categories.id, validCategoryIds));
}