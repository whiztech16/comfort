import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "../../src/db";
import { profiles, userSettings, users } from "../../src/db/schema";
import * as onboardingRepo from "../../src/modules/onboarding/onboarding.repository";
import { as, cleanup, createUser, type TestUser } from "../helpers/app";

vi.setConfig({ testTimeout: 90_000, hookTimeout: 90_000 });

const tag = () => Math.random().toString(36).slice(2, 10);
const valid = (over: Record<string, unknown> = {}) => ({
  displayName: "Test Person",
  username: `user_${tag()}`,
  bio: "Here to spread kindness",
  discoverableProfile: true,
  allowPrivateMessages: "allowed",
  ...over,
});
const onboard = (user: TestUser, body: object) => as(user).post("/users/onboarding").send(body);
const me = async (user: TestUser) => (await as(user).get("/auth/me")).body.data.user;

const people: TestUser[] = [];
const fresh = async (label: string) => {
  const user = await createUser(label, { onboard: false });
  people.push(user);
  return user;
};
afterAll(() => cleanup(people, []));

describe("access", () => {
  it("requires a valid access token", async () => {
    const user = await fresh("noauth");
    const bad = { ...user, token: "not.a.jwt" };
    expect((await onboard(bad, valid())).status).toBe(401);
    expect((await onboard({ ...user, token: "" }, valid())).status).toBe(401);
    expect((await me(user)).onboardingCompleted).toBe(false);
  });

  it("refuses suspended accounts", async () => {
    const user = await fresh("susp");
    await db.update(users).set({ status: "suspended" }).where(eq(users.id, user.id));
    expect((await onboard(user, valid())).status).toBe(401);
  });

  it("keeps the main app closed until onboarding is done (R15), but allows key setup", async () => {
    const user = await fresh("gate");
    for (const path of ["/posts", "/categories", "/conversations", "/notifications", "/comforts/received"]) {
      expect((await as(user).get(path)).status, path).toBe(403);
    }
    expect((await as(user).get("/auth/me")).status).toBe(200);
    const publicKey = Buffer.alloc(32, 7).toString("base64");
    expect((await as(user).put("/keys/account").send({ publicKey })).status).toBe(201);

    expect((await onboard(user, valid())).status).toBe(200);
    expect((await as(user).get("/posts")).status).toBe(200);
  });
});

describe("a successful onboarding", () => {
  it("saves the profile and privacy settings, normalised, and marks the account complete", async () => {
    const user = await fresh("ok");
    const username = `Ada_L_${tag()}`;
    const res = await onboard(user, valid({
      displayName: "  Ada Lovelace  ", username, bio: "", discoverableProfile: false, allowPrivateMessages: "requests_only",
    }));
    expect(res.status).toBe(200);
    const result = res.body.data.user;
    expect(result.onboardingCompleted).toBe(true);
    expect(result.profile).toEqual({ displayName: "Ada Lovelace", username: username.toLowerCase(), bio: null, avatarUrl: null });
    expect(result.settings).toEqual({ discoverableProfile: false, allowPrivateMessages: "requests_only" });
    expect(res.text).not.toMatch(/passwordHash|googleSub/);
    expect(res.headers["cache-control"]).toContain("no-store");

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    expect(profile).toMatchObject({ displayName: "Ada Lovelace", username: username.toLowerCase(), bio: null });
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    expect(settings).toMatchObject({ discoverableProfile: false, allowPrivateMessages: "requests_only", notifyNewComforts: true });

    const current = await me(user);
    expect(current.onboardingCompleted).toBe(true);
    expect(current.profile.username).toBe(username.toLowerCase());
  });

  it("makes the profile public to other onboarded users", async () => {
    const user = await fresh("pub");
    const viewer = await createUser("viewer");
    people.push(viewer);
    const username = `pub_${tag()}`;
    expect((await onboard(user, valid({ username, displayName: "Public Person" }))).status).toBe(200);
    const res = await as(viewer).get(`/users/${username}`);
    expect(res.status).toBe(200);
    expect(res.body.data.profile.displayName).toBe("Public Person");
  });

  it("refuses a second submission and keeps the first profile", async () => {
    const user = await fresh("twice");
    const first = valid();
    expect((await onboard(user, first)).status).toBe(200);
    const again = await onboard(user, valid({ displayName: "Someone Else" }));
    expect(again.status).toBe(409);
    expect((await me(user)).profile).toMatchObject({ displayName: first.displayName, username: first.username });
  });
});

describe("validation", () => {
  const validators: TestUser[] = [];
  beforeAll(async () => {
    for (const label of ["val1", "val2", "val3"]) validators.push(await fresh(label));
  });

  const cases: [string, Record<string, unknown>][] = [
    ["a missing displayName", valid({ displayName: undefined })],
    ["an empty displayName", valid({ displayName: "" })],
    ["a whitespace-only displayName", valid({ displayName: "   " })],
    ["a displayName over 50 characters", valid({ displayName: "a".repeat(51) })],
    ["a displayName with angle brackets", valid({ displayName: "<b>hi</b>" })],
    ["a displayName with a zero-width character", valid({ displayName: "Zero\u200bWidth" })],
    ["a displayName with a control character", valid({ displayName: "Bell\u0007" })],
    ["a missing username", valid({ username: undefined })],
    ["a username that is too short", valid({ username: "ab" })],
    ["a username that is too long", valid({ username: "a".repeat(21) })],
    ["a username starting with a digit", valid({ username: "1abcd" })],
    ["a username with a hyphen", valid({ username: "ab-cd" })],
    ["a username with a space", valid({ username: "ab cd" })],
    ["a username with non-ASCII letters", valid({ username: "tést_user" })],
    ["the reserved username admin", valid({ username: "admin" })],
    ["the reserved username me", valid({ username: "me" })],
    ["the reserved username support", valid({ username: "support" })],
    ["the reserved username anonymous", valid({ username: "anonymous" })],
    ["the reserved username comfort", valid({ username: "comfort" })],
    ["a bio over 160 characters", valid({ bio: "b".repeat(161) })],
    ["a bio with a newline", valid({ bio: "line1\nline2" })],
    ["a bio with angle brackets", valid({ bio: "<script>" })],
    ["discoverableProfile as a string", valid({ discoverableProfile: "yes" })],
    ["a missing discoverableProfile", valid({ discoverableProfile: undefined })],
    ["an invalid allowPrivateMessages", valid({ allowPrivateMessages: "everyone" })],
    ["a missing allowPrivateMessages", valid({ allowPrivateMessages: undefined })],
    ["a smuggled userId", valid({ userId: "00000000-0000-4000-8000-000000000000" })],
    ["a smuggled onboardingCompleted", valid({ onboardingCompleted: true })],
    ["a smuggled status", valid({ status: "active" })],
    ["a smuggled id", valid({ id: "00000000-0000-4000-8000-000000000000" })],
    ["a smuggled email", valid({ email: "x@example.com" })],
  ];
  cases.forEach(([name, body], i) => {
    it(`rejects ${name}`, async () => {
      const res = await onboard(validators[i % validators.length]!, body);
      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  it("changed nothing for any rejected submission", async () => {
    for (const user of validators) {
      const current = await me(user);
      expect(current.onboardingCompleted).toBe(false);
      expect(current.profile.displayName).toBeNull();
      expect(current.profile.username).toBeNull();
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
      expect(profile).toBeUndefined();
      const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
      expect(settings).toMatchObject({ discoverableProfile: true, allowPrivateMessages: "allowed" });
    }
  });

  it("rate limits submissions per user", async () => {
    const user = await fresh("limit");
    let limitedAt = 0;
    for (let i = 1; i <= 30 && !limitedAt; i++) {
      const res = await onboard(user, {});
      if (res.status === 429) limitedAt = i;
      else expect(res.status).toBe(422);
    }
    expect(limitedAt).toBe(21); // 20 per hour
  });
});

describe("identity comes from the token only", () => {
  it("ignores a victim's ID in the body (422) and in the query string", async () => {
    const victim = await fresh("victim");
    const attacker = await fresh("attacker");
    const smuggled = await onboard(attacker, valid({ userId: victim.id }));
    expect(smuggled.status).toBe(422);

    const username = `atk_${tag()}`;
    const viaQuery = await as(attacker).post(`/users/onboarding?userId=${victim.id}`).send(valid({ username }));
    expect(viaQuery.status).toBe(200);
    expect((await me(attacker)).profile.username).toBe(username);

    const stillIncomplete = await me(victim);
    expect(stillIncomplete.onboardingCompleted).toBe(false);
    expect(stillIncomplete.profile.username).toBeNull();
    const [victimProfile] = await db.select().from(profiles).where(eq(profiles.userId, victim.id));
    expect(victimProfile).toBeUndefined();
  });
});

describe("usernames and atomicity", () => {
  it("rejects a taken username (any case) and leaves the second account untouched", async () => {
    const first = await fresh("first");
    const second = await fresh("second");
    const username = `taken_${tag()}`;
    expect((await onboard(first, valid({ username }))).status).toBe(200);

    const clash = await onboard(second, valid({
      username: username.toUpperCase(), discoverableProfile: false, allowPrivateMessages: "off",
    }));
    expect(clash.status).toBe(409);
    expect(clash.body.errors[0].path).toBe("username");

    const current = await me(second);
    expect(current.onboardingCompleted).toBe(false);
    expect(current.profile.username).toBeNull();
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, second.id));
    expect(settings).toMatchObject({ discoverableProfile: true, allowPrivateMessages: "allowed" }); // rolled back

    expect((await onboard(second, valid())).status).toBe(200); // a fresh username works
  });

  it("lets only one of two simultaneous submissions win", async () => {
    const user = await fresh("race1");
    const [a, b] = await Promise.all([onboard(user, valid()), onboard(user, valid())]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    expect(rows).toHaveLength(1);
  });

  it("lets only one of two users win a username race", async () => {
    const one = await fresh("race2a");
    const two = await fresh("race2b");
    const username = `race_${tag()}`;
    const [a, b] = await Promise.all([onboard(one, valid({ username })), onboard(two, valid({ username }))]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });

  it("rolls everything back when the final write fails", async () => {
    const user = await fresh("tx");
    const username = `tx_${tag()}`;
    const body = valid({ username, discoverableProfile: false, allowPrivateMessages: "off" });

    const spy = vi.spyOn(onboardingRepo, "markOnboardingComplete").mockRejectedValueOnce(new Error("simulated failure"));
    const res = await onboard(user, body);
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(res.text).not.toContain("simulated");

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    expect(profile).toBeUndefined();
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row!.onboardingCompleted).toBe(false);
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    expect(settings).toMatchObject({ discoverableProfile: true, allowPrivateMessages: "allowed" });

    expect((await onboard(user, body)).status).toBe(200); // the username is free again
  });
});