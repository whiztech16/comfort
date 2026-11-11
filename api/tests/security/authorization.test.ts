import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../src/db";
import { comforts, messages } from "../../src/db/schema";
import { ORIGIN, app, as, cleanup, createCategory, createUser, encryptedMessage, expectStatus, randomIp, type TestUser } from "../helpers/app";

const PLAIN = "Plain text that must never be stored";

describe("security rules", () => {
  let owner: TestUser; // post author and Comfort recipient
  let sender: TestUser;
  let outsider: TestUser;
  let fresh: TestUser; // registered, never onboarded
  let categoryId = "";
  let postId = "";
  let comfort1 = "";
  let comfort2 = "";
  let convId = "";

  beforeAll(async () => {
    owner = await createUser("owner");
    sender = await createUser("sndr");
    outsider = await createUser("outs");
    fresh = await createUser("fresh", { onboard: false });
    categoryId = (await createCategory()).id;

    postId = expectStatus(await as(owner).post("/posts").send({ content: "Post", categoryId, isAnonymous: false }), 201, "post").body.data.post.id;
    comfort1 = expectStatus(await as(sender).post("/comforts").send({ postId, content: PLAIN, isAnonymous: true }), 201, "comfort 1").body.data.comfort.id;
    comfort2 = expectStatus(await as(sender).post("/comforts").send({ postId, content: "Second one", isAnonymous: true }), 201, "comfort 2").body.data.comfort.id;
  });

  afterAll(() => cleanup([owner, sender, outsider, fresh], [categoryId]));

  describe("authentication", () => {
    it("rejects missing, garbage, tampered and alg:none tokens", async () => {
      const get = (auth?: string) => {
        const r = request(app).get("/api/v1/posts").set("X-Forwarded-For", randomIp());
        return auth ? r.set("Authorization", auth) : r;
      };
      expect((await get()).status).toBe(401);
      expect((await get("Bearer not.a.jwt")).status).toBe(401);
      expect((await get(`Bearer ${owner.token.slice(0, -3)}AAA`)).status).toBe(401);

      const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
      const now = Math.floor(Date.now() / 1000);
      const none = `${part({ alg: "none", typ: "JWT" })}.${part({
        sub: owner.id,
        sid: randomUUID(),
        iss: process.env.JWT_ISSUER ?? "comfort-api",
        aud: process.env.JWT_AUDIENCE ?? "comfort-web",
        iat: now,
        exp: now + 600,
      })}.`;
      expect((await get(`Bearer ${none}`)).status).toBe(401);
    });

    it("blocks an account that has not finished onboarding", async () => {
      expect((await as(fresh).get("/posts")).status).toBe(403);
      expect((await as(fresh).get("/auth/me")).status).toBe(200);
    });

    it("requires the frontend Origin on writes", async () => {
      const send = (origin?: string) => {
        const r = request(app).post("/api/v1/auth/login").set("X-Forwarded-For", randomIp());
        return (origin ? r.set("Origin", origin) : r).send({ email: "a@example.com", password: "x" });
      };
      expect((await send("http://evil.example")).status).toBe(403);
      expect((await send()).status).toBe(403);
      expect((await send(ORIGIN)).status).not.toBe(403);
    });
  });

  describe("Comfort rules", () => {
    it("never lets someone Comfort themselves or choose the recipient (R3, R4)", async () => {
      expect((await as(owner).post("/comforts").send({ postId, content: "Hi me", isAnonymous: true })).status).toBe(403);
      const smuggled = await as(sender).post("/comforts").send({ postId, content: "Hi", isAnonymous: true, recipientId: randomUUID() });
      expect(smuggled.status).toBe(422);
    });

    it("hides Comforts from everyone except the two people involved (R8)", async () => {
      // An outsider can't see, open or appreciate it
      expect((await as(outsider).get(`/comforts/${comfort1}`)).status).toBe(404);
      expect((await as(outsider).post(`/comforts/${comfort1}/open`)).status).toBe(404);
      expect((await as(outsider).post(`/comforts/${comfort1}/appreciation`).send({ type: "thank_you" })).status).toBe(404);
      // The sender can't open or appreciate their own Comfort
      expect((await as(sender).post(`/comforts/${comfort1}/open`)).status).toBe(404);
      expect((await as(sender).post(`/comforts/${comfort1}/appreciation`).send({ type: "thank_you" })).status).toBe(404);
    });

    it("keeps an unopened Comfort sealed for the recipient", async () => {
      const res = await as(owner).get(`/comforts/${comfort1}`);
      expect(res.body.data.comfort.content).toBeNull();
      expect((await as(owner).post(`/comforts/${comfort1}/appreciation`).send({ type: "thank_you" })).status).toBe(409);
    });

    it("records the first open once and appreciation once (R7, R13)", async () => {
      const first = expectStatus(await as(owner).post(`/comforts/${comfort1}/open`), 200, "first open");
      expect(first.body.data.wasAlreadyOpened).toBe(false);
      expect(first.body.data.comfort.content).toBe(PLAIN);
      expect((await as(owner).post(`/comforts/${comfort1}/open`)).body.data.wasAlreadyOpened).toBe(true);

      expect((await as(owner).post(`/comforts/${comfort1}/appreciation`).send({ type: "thank_you" })).status).toBe(200);
      expect((await as(owner).post(`/comforts/${comfort1}/appreciation`).send({ type: "thank_you" })).status).toBe(409);
    });
  });

  describe("conversations", () => {
    it("lets only the recipient start one, once (R5, R6)", async () => {
      expect((await as(sender).post("/conversations").send({ comfortId: comfort1 })).status).toBe(404);
      expect((await as(outsider).post("/conversations").send({ comfortId: comfort1 })).status).toBe(404);
      const made = expectStatus(await as(owner).post("/conversations").send({ comfortId: comfort1 }), 201, "create conversation");
      convId = made.body.data.conversation.id;
      expect((await as(owner).post("/conversations").send({ comfortId: comfort1 })).status).toBe(409);
    });

    it("hides conversations from non-participants (R9)", async () => {
      expect(convId).not.toBe("");
      expect((await as(outsider).get(`/conversations/${convId}`)).status).toBe(404);
      expect((await as(outsider).get(`/conversations/${convId}/messages`)).status).toBe(404);
      expect((await as(outsider).post(`/conversations/${convId}/messages`).send(encryptedMessage())).status).toBe(404);
      expect((await as(outsider).post(`/conversations/${convId}/read`)).status).toBe(404);
    });

    it("refuses plaintext and stores ciphertext only (R10)", async () => {
      expect((await as(sender).post(`/conversations/${convId}/messages`).send({ content: "hello" })).status).toBe(422);
      expect((await as(sender).post(`/conversations/${convId}/messages`).send({ ...encryptedMessage(), content: "hello" })).status).toBe(422);

      const sent = encryptedMessage();
      const res = expectStatus(await as(sender).post(`/conversations/${convId}/messages`).send(sent), 201, "send message");
      const [row] = await db.select().from(messages).where(eq(messages.id, res.body.data.message.id));
      expect(row!.ciphertext).toBe(sent.ciphertext);
      expect(Object.keys(row!)).not.toContain("content");
      expect(Object.keys(row!)).not.toContain("plaintext");
    });

    it("locks a blocked conversation but keeps history readable (R11)", async () => {
      expectStatus(await as(owner).post(`/comforts/${comfort1}/block`), 201, "block");
      const blocked = await as(sender).post(`/conversations/${convId}/messages`).send(encryptedMessage());
      expect(blocked.status).toBe(403);
      expect(blocked.body.code).toBe("BLOCKED");
      expect((await as(sender).get(`/conversations/${convId}/messages`)).status).toBe(200);

      const blockId = (await as(owner).get("/blocks")).body.data.items[0].id;
      expect((await as(owner).delete(`/blocks/${blockId}`)).status).toBe(200);
      expect((await as(sender).post(`/conversations/${convId}/messages`).send(encryptedMessage())).status).toBe(201);
    });
  });

  describe("encryption at rest", () => {
    it("stores Comforts as ciphertext with a 12-byte nonce", async () => {
      const [row] = await db.select().from(comforts).where(eq(comforts.id, comfort1));
      expect(row!.contentCiphertext).not.toContain(PLAIN);
      expect(row!.contentCiphertext).not.toContain(Buffer.from(PLAIN).toString("base64"));
      expect(row!.contentNonce).toHaveLength(16);
      expect(row!.keyVersion).toBeGreaterThanOrEqual(1);
      expect((await as(sender).get(`/comforts/${comfort1}`)).body.data.comfort.content).toBe(PLAIN);
    });

    it("refuses a ciphertext moved onto another Comfort (AAD binding)", async () => {
      const [one] = await db.select().from(comforts).where(eq(comforts.id, comfort1));
      const [two] = await db.select().from(comforts).where(eq(comforts.id, comfort2));
      try {
        await db
          .update(comforts)
          .set({ contentCiphertext: two!.contentCiphertext, contentNonce: two!.contentNonce, keyVersion: two!.keyVersion })
          .where(eq(comforts.id, comfort1));
        // Decryption must fail, and the response must stay generic
        const res = await as(sender).get(`/comforts/${comfort1}`);
        expect(res.status).toBe(500);
        expect(res.text).not.toContain(two!.contentCiphertext);
      } finally {
        await db
          .update(comforts)
          .set({ contentCiphertext: one!.contentCiphertext, contentNonce: one!.contentNonce, keyVersion: one!.keyVersion })
          .where(eq(comforts.id, comfort1));
      }
      expect((await as(sender).get(`/comforts/${comfort1}`)).status).toBe(200);
    });
  });

  describe("abuse limits", () => {
    const json = () =>
      request(app)
        .post("/api/v1/auth/login")
        .set({ Origin: ORIGIN, "Content-Type": "application/json", "X-Forwarded-For": randomIp() });

    it("rejects oversized and malformed JSON bodies", async () => {
      expect((await json().send(JSON.stringify({ email: "x".repeat(11_000), password: "y" }))).status).toBe(413);
      expect((await json().send("{bad")).status).toBe(400);
    });

    it("rate limits repeated login attempts", async () => {
      const ip = randomIp();
      const email = `nobody-${randomBytes(4).toString("hex")}@example.com`;
      let limitedAt = 0;
      // Same IP and email every time, so the login limiter's counter keeps growing
      for (let i = 1; i <= 40 && !limitedAt; i++) {
        const res = await request(app)
          .post("/api/v1/auth/login")
          .set({ Origin: ORIGIN, "X-Forwarded-For": ip })
          .send({ email, password: "WrongPass123!" });
        if (res.status === 429) limitedAt = i;
        else expect(res.status).toBe(401);
      }
      expect(limitedAt).toBeGreaterThan(1); // the first attempt is allowed
    }, 60_000);
  });
});