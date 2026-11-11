import { z } from "zod";

// Canonical standard base64 within a byte range
const base64Range = (minBytes: number, maxBytes: number) =>
  z
    .string()
    .max(Math.ceil(maxBytes / 3) * 4)
    .refine((v) => {
      if (v.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(v)) return false;
      const buf = Buffer.from(v, "base64");
      return buf.length >= minBytes && buf.length <= maxBytes && buf.toString("base64") === v;
    }, "Invalid base64 value");

const base64Exact = (bytes: number) => base64Range(bytes, bytes);

export const createConversationSchema = z.object({ comfortId: z.string().uuid() }).strict();

export const conversationParamsSchema = z.object({ id: z.string().uuid() }).strict();

// Only encrypted fields exist, so plaintext can't be sent
export const sendMessageSchema = z
  .object({
    ciphertext: base64Range(17, 4500), // at least the 16-byte tag plus 1 byte
    nonce: base64Exact(24), // XChaCha20-Poly1305 nonce
    senderWrappedKey: base64Exact(80), // crypto_box_seal of a 32-byte key
    recipientWrappedKey: base64Exact(80),
  })
  .strict();

export const pageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(300).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type PageQuery = z.infer<typeof pageQuerySchema>;