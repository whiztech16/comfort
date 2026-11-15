import sodium from "libsodium-wrappers-sumo";

const b64 = (b: Uint8Array) => sodium.to_base64(b, sodium.base64_variants.ORIGINAL);
const unb64 = (s: string) => sodium.from_base64(s, sodium.base64_variants.ORIGINAL);

export const MAX_MESSAGE_CHARS = 1000;
// The server caps ciphertext at 4500 bytes, and 16 of them are the tag
const MAX_MESSAGE_BYTES = 4400;

export type SealedMessage = {
  ciphertext: string;
  nonce: string;
  senderWrappedKey: string;
  recipientWrappedKey: string;
};

type OpenInput = SealedMessage & { isMine: boolean };
type Keys = { publicKeyB64: string; privateKey: Uint8Array };

const aadFor = (conversationId: string) => `conversation:${conversationId}`;

export async function sealMessage(opts: {
  text: string;
  conversationId: string;
  myPublicKeyB64: string;
  theirPublicKeyB64: string;
}): Promise<SealedMessage> {
  await sodium.ready;
  if (new TextEncoder().encode(opts.text).length > MAX_MESSAGE_BYTES) {
    throw new Error("Message is too long");
  }

  const key = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  try {
    const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      opts.text,
      aadFor(opts.conversationId),
      null,
      nonce,
      key,
    );
    return {
      ciphertext: b64(cipher),
      nonce: b64(nonce),
      senderWrappedKey: b64(sodium.crypto_box_seal(key, unb64(opts.myPublicKeyB64))),
      recipientWrappedKey: b64(sodium.crypto_box_seal(key, unb64(opts.theirPublicKeyB64))),
    };
  } finally {
    sodium.memzero(key);
  }
}

// Returns the text, or null if this device can't read the message
export async function openMessage(
  message: OpenInput,
  conversationId: string,
  keys: Keys,
): Promise<string | null> {
  await sodium.ready;
  let key: Uint8Array | null = null;
  try {
    const wrapped = unb64(message.isMine ? message.senderWrappedKey : message.recipientWrappedKey);
    key = sodium.crypto_box_seal_open(wrapped, unb64(keys.publicKeyB64), keys.privateKey);
    const plain = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      unb64(message.ciphertext),
      aadFor(conversationId),
      unb64(message.nonce),
      key,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  } finally {
    if (key) sodium.memzero(key);
  }
}