import { z } from "zod";

// Canonical standard base64 that decodes to exactly `bytes` bytes
const base64Bytes = (bytes: number) =>
  z
    .string()
    .length(Math.ceil(bytes / 3) * 4)
    .refine((v) => {
      const buf = Buffer.from(v, "base64");
      return /^[A-Za-z0-9+/]+={0,2}$/.test(v) && buf.length === bytes && buf.toString("base64") === v;
    }, "Invalid base64 value");

// An all-zero key is never valid
const key32 = base64Bytes(32).refine((v) => Buffer.from(v, "base64").some((b) => b !== 0), "Invalid key");

export const accountKeySchema = z.object({ publicKey: key32 }).strict();

export const backupSchema = z
  .object({
    encryptedPrivateKey: base64Bytes(48), // secretbox of a 32-byte key
    nonce: base64Bytes(24),
  })
  .strict();

export const createLinkRequestSchema = z.object({ ephemeralPublicKey: key32 }).strict();

export const approveLinkRequestSchema = z
  .object({ encryptedPayload: base64Bytes(80) }) // crypto_box_seal of a 32-byte key
  .strict();

export const linkParamsSchema = z.object({ id: z.string().uuid() }).strict();