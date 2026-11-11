import sodium from "libsodium-wrappers";

const b64 = (b: Uint8Array) => sodium.to_base64(b, sodium.base64_variants.ORIGINAL);
const unb64 = (s: string) => sodium.from_base64(s, sodium.base64_variants.ORIGINAL);

// Passphrase -> 32-byte key. Params are fixed for backup version 1
async function deriveKey(passphrase: string, salt: Uint8Array) {
  await sodium.ready;
  return sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    passphrase.normalize("NFKC"),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

export async function generateAccountKeys() {
  await sodium.ready;
  const { publicKey, privateKey } = sodium.crypto_box_keypair();
  return { publicKey, privateKey, publicKeyB64: b64(publicKey) };
}

// Encrypts the private key for upload. All three values are base64
export async function createBackup(privateKey: Uint8Array, passphrase: string) {
  await sodium.ready;
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  let key: Uint8Array | null = null;
  try {
    key = await deriveKey(passphrase, salt);
    const cipher = sodium.crypto_secretbox_easy(privateKey, nonce, key);
    return {
      encryptedPrivateKey: b64(cipher),
      nonce: b64(nonce),
      kdfSalt: b64(salt),
    };
  } finally {
    if (key) sodium.memzero(key);
  }
}

// Returns the private key, or null if the passphrase is wrong
export async function restoreFromBackup(
  backup: { encryptedPrivateKey: string; nonce: string; kdfSalt: string },
  passphrase: string,
  serverPublicKeyB64: string,
): Promise<Uint8Array | null> {
  await sodium.ready;
  let key: Uint8Array | null = null;
  try {
    const salt = unb64(backup.kdfSalt);
    const nonce = unb64(backup.nonce);
    const cipher = unb64(backup.encryptedPrivateKey);

    // Validate expected cryptographic buffer sizes before decryption
    if (salt.length !== sodium.crypto_pwhash_SALTBYTES) return null;
    if (nonce.length !== sodium.crypto_secretbox_NONCEBYTES) return null;
    if (cipher.length !== sodium.crypto_secretbox_KEYBYTES + sodium.crypto_secretbox_MACBYTES) return null;

    key = await deriveKey(passphrase, salt);
    const privateKey = sodium.crypto_secretbox_open_easy(cipher, nonce, key);

    // Must match the public key the server holds for this account
    const derivedPublic = b64(sodium.crypto_scalarmult_base(privateKey));
    return derivedPublic === serverPublicKeyB64 ? privateKey : null;
  } catch {
    return null; // decryption failed: wrong passphrase
  } finally {
    if (key) sodium.memzero(key);
  }
}

export function computePublicKeyB64(privateKey: Uint8Array): string {
  return b64(sodium.crypto_scalarmult_base(privateKey));
}

// --- IndexedDB Client-Side Key Storage ---

const DB_NAME = "comfort_chat_keys";
const DB_VERSION = 1;
const STORE_NAME = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredKeypair {
  publicKeyB64: string;
  privateKey: Uint8Array;
}

export async function storeLocalKey(userId: string, keypair: StoredKeypair): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(keypair, userId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalKey(userId: string): Promise<StoredKeypair | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(userId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeLocalKey(userId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(userId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Private Device Preference Helpers ---

const PRIVATE_DEVICE_KEY = "comfort_is_private_device";

export function isPrivateDevice(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(PRIVATE_DEVICE_KEY) === "true";
}

export function setPrivateDevice(isPrivate: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PRIVATE_DEVICE_KEY, isPrivate ? "true" : "false");
}

