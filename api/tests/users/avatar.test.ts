import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { as, cleanup, createUser, type TestUser } from "../helpers/app";

// Fake Cloudinary: records what would be uploaded and deleted
const store = vi.hoisted(() => ({ uploaded: [] as Buffer[], deleted: [] as string[], count: 0 }));
vi.mock("../../src/services/storage.service", () => ({
  uploadAvatar: async (buf: Buffer) => {
    store.uploaded.push(buf);
    store.count += 1;
    return {
      url: `https://res.cloudinary.com/test/image/upload/avatar${store.count}.webp`,
      publicId: `comfort/avatars/avatar${store.count}`,
    };
  },
  deleteAvatar: async (id: string) => {
    store.deleted.push(id);
  },
}));

const blank = { create: { width: 800, height: 600, channels: 3 as const, background: "#3b82f6" } };
const png = () => sharp(blank).png().toBuffer();

describe("avatar upload", () => {
  let user: TestUser;
  let fresh: TestUser;

  beforeAll(async () => {
    user = await createUser("avatar");
    fresh = await createUser("freshav", { onboard: false });
  });
  afterAll(() => cleanup([user, fresh], []));

  const upload = (who: TestUser, buf: Buffer, field = "avatar", filename = "me.png", contentType = "image/png") =>
    as(who).post("/users/me/avatar").attach(field, buf, { filename, contentType });

  it("re-encodes to a 512x512 WebP and strips EXIF data", async () => {
    const photo = await sharp(blank).jpeg().withMetadata({ exif: { IFD0: { Copyright: "secret-owner" } } }).toBuffer();
    expect(photo.toString("latin1")).toContain("secret-owner"); // the input really has it

    const res = await upload(user, photo, "avatar", "photo.jpg", "image/jpeg");
    expect(res.status).toBe(200);
    expect(res.body.data.profile.avatarUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    const processed = store.uploaded[store.uploaded.length - 1]!;
    const meta = await sharp(processed).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", 512, 512]);
    expect(meta.exif).toBeUndefined();
    expect(processed.toString("latin1")).not.toContain("secret-owner");
  });

  it("replaces the avatar and deletes the previous image", async () => {
    const deletedBefore = store.deleted.length;
    const first = (await as(user).get("/auth/me")).body.data.user.profile.avatarUrl;
    const res = await upload(user, await png());
    expect(res.status).toBe(200);
    expect(res.body.data.profile.avatarUrl).not.toBe(first);
    expect(store.deleted.length).toBe(deletedBefore + 1);
  });

  it("rejects non-images, GIFs, oversized files, and bad forms before Cloudinary", async () => {
    const uploadsBefore = store.uploaded.length;

    // A text file renamed .png fails the magic-byte check
    expect((await upload(user, Buffer.from("not an image at all"))).status).toBe(422);
    // GIFs aren't allowed
    expect((await upload(user, Buffer.from("GIF89a" + "\0".repeat(40), "latin1"), "avatar", "a.gif", "image/gif")).status).toBe(422);
    // Over 2 MB
    expect((await upload(user, Buffer.alloc(2_200_000))).status).toBe(413);
    // Wrong field name, extra form field, or no file at all
    expect((await upload(user, await png(), "file")).status).toBe(422);
    expect((await as(user).post("/users/me/avatar").field("note", "x").attach("avatar", await png(), "me.png")).status).toBe(422);
    expect((await as(user).post("/users/me/avatar").send({})).status).toBe(422);

    expect(store.uploaded.length).toBe(uploadsBefore);
  });

  it("requires an onboarded account", async () => {
    expect((await upload(fresh, await png())).status).toBe(403);
  });

  it("removes the avatar, and removing it again is harmless", async () => {
    const deletedBefore = store.deleted.length;
    const res = await as(user).delete("/users/me/avatar");
    expect(res.status).toBe(200);
    expect(res.body.data.profile.avatarUrl).toBeNull();
    expect(store.deleted.length).toBe(deletedBefore + 1);
    expect((await as(user).delete("/users/me/avatar")).status).toBe(200);
  });
});