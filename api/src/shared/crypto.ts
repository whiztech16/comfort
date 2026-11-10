import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env";

const ALGO = "aes-256-gcm";
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function keyFor(version: number): Buffer {
  const raw = process.env[`AT_REST_KEY_V${version}`];
  const key = raw ? Buffer.from(raw, "base64") : null;
  if (!key || key.length !== 32) throw new Error("At-rest key unavailable");
  return key;
}

export type Sealed = { ciphertext: string; nonce: string; keyVersion: number };

export function encryptAtRest(aad: string, plaintext: string): Sealed {
  const keyVersion = env.AT_REST_ACTIVE_KEY_VERSION;
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGO, keyFor(keyVersion), nonce, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: Buffer.concat([body, cipher.getAuthTag()]).toString("base64"),
    nonce: nonce.toString("base64"),
    keyVersion,
  };
}

export function decryptAtRest(aad: string, sealed: Sealed): string {
  const nonce = Buffer.from(sealed.nonce, "base64");
  const all = Buffer.from(sealed.ciphertext, "base64");
  if (nonce.length !== NONCE_BYTES || all.length <= TAG_BYTES) throw new Error("Malformed ciphertext");

  const decipher = createDecipheriv(ALGO, keyFor(sealed.keyVersion), nonce, { authTagLength: TAG_BYTES });
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(all.subarray(all.length - TAG_BYTES));
  return Buffer.concat([decipher.update(all.subarray(0, all.length - TAG_BYTES)), decipher.final()]).toString("utf8");
}