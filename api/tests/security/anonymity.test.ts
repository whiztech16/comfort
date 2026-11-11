import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "socket.io";
import { setIo } from "../../src/sockets/emitter";
import { as, cleanup, createCategory, createUser, encryptedMessage, expectStatus, type TestUser } from "../helpers/app";

// Stand-in for Socket.IO: records every emit and the room it went to
type Emit = { room: string; event: string; payload: unknown };
const emitted: Emit[] = [];
setIo({
  to: (room: string) => ({
    emit: (event: string, payload: unknown) => {
      emitted.push({ room, event, payload });
    },
  }),
} as unknown as Server);

const ANONYMOUS = { displayName: "Anonymous", username: null, avatarUrl: null, isAnonymous: true };
const FORBIDDEN_KEYS = [
  "userId", "senderId", "recipientId", "authorId", "counterpartId",
  "reportedUserId", "blockerId", "blockedId", "googleSub", "passwordHash", "email",
];

function collectKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectKeys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      collectKeys(v, out);
    }
  }
  return out;
}

describe("anonymity sweep (PRD 8.3)", () => {
  let poster: TestUser; // writes the anonymous post, receives the Comfort
  let sender: TestUser; // sends the anonymous Comfort
  let viewer: TestUser; // an unrelated user
  let author: TestUser; // posts publicly, so feeds have visible content
  let categorySlug = "";
  let categoryId = "";
  let postId = "";
  let anonAuthor: unknown;
  let anonCounterpart: unknown;

  // Every response in the journey, success or error
  const seen: { label: string; text: string }[] = [];
  const capture = <T extends { status: number; text: string }>(label: string, res: T, status: number): T => {
    expectStatus(res, status, label);
    seen.push({ label, text: res.text });
    return res;
  };

  beforeAll(async () => {
    poster = await createUser("poster");
    sender = await createUser("sender");
    viewer = await createUser("viewer");
    author = await createUser("author");
    const cat = await createCategory();
    categoryId = cat.id;
    categorySlug = cat.slug;

    capture("author posts publicly", await as(author).post("/posts").send({ content: "A public post", categoryId, isAnonymous: false }), 201);
    const anon = capture("poster posts anonymously", await as(poster).post("/posts").send({ content: "An anonymous post", categoryId, isAnonymous: true }), 201);
    postId = anon.body.data.post.id;

    const sent = capture("sender sends anonymous Comfort", await as(sender).post("/comforts").send({ postId, content: "You are not alone", isAnonymous: true }), 201);
    const comfortId = sent.body.data.comfort.id;

    // Feeds and single posts, seen by every kind of viewer
    capture("viewer feed", await as(viewer).get("/posts"), 200);
    capture("viewer category feed", await as(viewer).get(`/posts?category=${categorySlug}`), 200);
    anonAuthor = capture("viewer single post", await as(viewer).get(`/posts/${postId}`), 200).body.data.post.author;
    capture("sender feed", await as(sender).get("/posts"), 200);
    capture("poster feed", await as(poster).get("/posts"), 200);
    capture("poster own posts", await as(poster).get("/users/me/posts"), 200);
    capture("viewer cannot read the Comfort", await as(viewer).get(`/comforts/${comfortId}`), 404);

    // Comfort lifecycle as the recipient
    anonCounterpart = capture("poster received", await as(poster).get("/comforts/received"), 200).body.data.items[0].counterpart;
    capture("poster reads Comfort", await as(poster).get(`/comforts/${comfortId}`), 200);
    capture("poster opens Comfort", await as(poster).post(`/comforts/${comfortId}/open`), 200);
    capture("poster appreciates", await as(poster).post(`/comforts/${comfortId}/appreciation`).send({ type: "this_helped" }), 200);
    capture("sender sent list", await as(sender).get("/comforts/sent"), 200);
    capture("sender reads Comfort", await as(sender).get(`/comforts/${comfortId}`), 200);

    // Notifications for everyone
    capture("poster notifications", await as(poster).get("/notifications"), 200);
    capture("sender notifications", await as(sender).get("/notifications"), 200);
    capture("viewer notifications", await as(viewer).get("/notifications"), 200);

    // Conversation and messages
    const conv = capture("poster starts conversation", await as(poster).post("/conversations").send({ comfortId }), 201);
    const convId = conv.body.data.conversation.id;
    capture("poster conversations", await as(poster).get("/conversations"), 200);
    capture("sender conversations", await as(sender).get("/conversations"), 200);
    capture("viewer conversations", await as(viewer).get("/conversations"), 200);
    capture("sender conversation", await as(sender).get(`/conversations/${convId}`), 200);
    capture("sender sends message", await as(sender).post(`/conversations/${convId}/messages`).send(encryptedMessage()), 201);
    capture("poster messages", await as(poster).get(`/conversations/${convId}/messages`), 200);
    capture("poster marks read", await as(poster).post(`/conversations/${convId}/read`), 200);

    // Reports and blocks name no one
    capture("poster reports Comfort", await as(poster).post("/reports").send({ targetType: "comfort", targetId: comfortId, reason: "spam" }), 201);
    capture("poster blocks sender", await as(poster).post(`/comforts/${comfortId}/block`), 201);
    capture("poster block list", await as(poster).get("/blocks"), 200);
    capture("locked conversation", await as(sender).get(`/conversations/${convId}`), 200);
    capture("locked messages", await as(poster).get(`/conversations/${convId}/messages`), 200);
    capture("blocked send", await as(sender).post(`/conversations/${convId}/messages`).send(encryptedMessage()), 403);
    capture("sender sent list after block", await as(sender).get("/comforts/sent"), 200);
  });

  afterAll(() => cleanup([poster, sender, viewer, author], [categoryId]));

  // Things that must never appear anywhere a client can see
  const hidden = () =>
    [poster, sender]
      .filter((u): u is TestUser => Boolean(u))
      .flatMap((u) => [u.id, u.email, u.username, u.displayName])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // Realtime helpers: what each user's room received
  const to = (user: TestUser) => emitted.filter((e) => e.room === `user:${user.id}`);
  const eventsOf = (user: TestUser) => new Set(to(user).map((e) => e.event));

  it("never shows a hidden user's id, email, username or name in any response", () => {
    expect(seen.length).toBeGreaterThan(30);
    for (const needle of hidden()) {
      for (const { label, text } of seen) {
        expect(text.toLowerCase(), `${label} leaks ${needle}`).not.toContain(needle.toLowerCase());
      }
    }
  });

  it("never exposes identity-bearing field names", () => {
    for (const { label, text } of seen) {
      const keys = collectKeys(JSON.parse(text || "{}"));
      for (const key of FORBIDDEN_KEYS) expect(keys.has(key), `${label} has field ${key}`).toBe(false);
    }
  });

  it("shows anonymous authors and senders as the fixed Anonymous identity", () => {
    expect(anonAuthor).toEqual(ANONYMOUS);
    expect(anonCounterpart).toEqual(ANONYMOUS);
  });

  it("keeps anonymous posts off the public profile (R12)", async () => {
    const res = await as(viewer).get(`/users/${poster.username}/posts`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.text).not.toContain(postId);
  });

  it("sends each realtime event to the right people only", () => {
    // A missing event means that service's hook is not applied yet
    for (const event of ["comfort:new", "notification:new", "conversation:updated", "message:new", "message:read"]) {
      expect(
        emitted.some((e) => e.event === event),
        `no ${event} was emitted (is its hook in place?)`,
      ).toBe(true);
    }
    expect(eventsOf(poster).has("comfort:new"), "recipient should get comfort:new").toBe(true);
    expect(eventsOf(sender).has("comfort:new"), "sender must not get comfort:new").toBe(false);
    expect(eventsOf(poster).has("message:new") && eventsOf(sender).has("message:new"), "both get message:new").toBe(true);
    expect(eventsOf(sender).has("message:read"), "sender should see the read receipt").toBe(true);
    // Strangers hear nothing
    expect(to(viewer)).toHaveLength(0);
    expect(to(author)).toHaveLength(0);
  });

  it("keeps realtime payloads free of identity", () => {
    expect(emitted.length).toBeGreaterThan(0);
    for (const { event, payload } of emitted) {
      const text = (JSON.stringify(payload ?? {}) ?? "").toLowerCase();
      for (const needle of hidden()) expect(text, `${event} leaks ${needle}`).not.toContain(needle.toLowerCase());
      const keys = collectKeys(payload ?? {});
      for (const key of FORBIDDEN_KEYS) expect(keys.has(key), `${event} has field ${key}`).toBe(false);
    }

    // The new-Comfort event carries the Comfort ID and nothing else
    const comfortNew = emitted.find((e) => e.event === "comfort:new");
    expect(comfortNew, "comfort:new was not emitted").toBeDefined();
    expect(Object.keys((comfortNew?.payload as object) ?? {})).toEqual(["comfortId"]);
  });
});