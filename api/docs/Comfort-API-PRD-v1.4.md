# Comfort API — Product and Technical Requirements Document
**Project:** comfort-api  
**Document Version:** 1.4  
**Status:** Approved for Implementation  
**Consumer:** comfort-frontend (React, TypeScript, Vite, Tailwind CSS v4)  
**Date:** November 2026  

---

## 1. Executive Summary & Architectural Principles

`comfort-api` is the backend system powering **Comfort**, a peer mental wellness and kindness platform. The platform couples public community sharing (posts, categories) with private supportive messaging (Comfort envelopes) and end-to-end encrypted conversations.

### 1.1 Core Architectural Principles

1. **Separation of Authentication and Chat-Key State**:
   Account authentication (`access_token` session verification) and chat-key availability (private cryptographic scalar available in client memory / IndexedDB) are **independent states**. A user can be authenticated but will be barred from reading or sending encrypted conversation history until their chat key is unlocked.

2. **Dual-Layer Cryptographic Architecture**:
   - **Comfort Envelopes at Rest**: Encrypted symmetrically server-side using versioned `aes-256-gcm` keys (`AT_REST_KEY_V1`) with authenticated associated data (`aad: comfort:<id>`). Unopened comforts are masked from recipients until the envelope reveal action triggers decryption.
   - **Conversations (E2EE)**: End-to-end encrypted between participant devices using `libsodium-wrappers` (Curve25519/X25519 key exchange, XSalsa20-Poly1305 / secretbox, and box_seal). The server routes and stores only ciphertext; it never has access to plaintext conversation contents, private keys, or passphrases.

3. **Zero-Knowledge Key Backup**:
   The server stores only the client's passphrase-encrypted private key, nonce, KDF salt, and format version. The server never receives the user's passphrase or the derived key, and cannot decrypt the backup blob.

4. **Guaranteed Anonymity**:
   Anonymity is cryptographically enforced and scrubbed at the serialization boundary (`public-identity.ts`). An anonymous post author or comfort sender cannot be identified via API enumeration or database leaks.

---

## 2. Updated Onboarding Flow (Chat Keys as Mandatory Gate)

Under PRD v1.4, chat-key generation is a mandatory phase of onboarding. A user cannot complete onboarding or access protected platform features without establishing their cryptographic identity.

### 2.1 The 5-Step Onboarding Sequence

```
1. Welcome ──> 2. Profile ──> 3. Privacy ──> 4. Protect your chats ──> 5. Completion
                                                    │
                                  ┌─────────────────┴─────────────────┐
                                  │ Generate/reuse X25519 keypair     │
                                  │ Save keypair to IndexedDB         │
                                  │ PUT /api/v1/keys/account          │
                                  │ PUT /api/v1/keys/backup           │
                                  │ POST /api/v1/users/onboarding     │
                                  └───────────────────────────────────┘
```

1. **Step 1: Welcome**: Introduction to platform values and mutual kindness guidelines.
2. **Step 2: Profile**: Choose display name, handle (`username`), and optional bio.
3. **Step 3: Privacy**: Choose discoverability (`discoverableProfile`) and messaging preferences (`allowPrivateMessages`).
4. **Step 4: Protect your chats**:
   - The user inputs a strong passphrase (validated client-side via `zxcvbn`).
   - The client generates an X25519 keypair (or retrieves the existing pair from IndexedDB if retrying).
   - Derives an encryption key from the passphrase using Argon2id (`crypto_pwhash`).
   - Encrypts the private scalar using `crypto_secretbox_easy`.
   - Stores the keypair immediately in IndexedDB.
   - Uploads public key and encrypted backup to the API.
5. **Step 5: Completion**: Final confirmation; `onboardingCompleted` becomes `true`.

### 2.2 Final API Sequence & Failure Invariants

The client MUST execute the following API sequence in order:

```http
1. PUT /api/v1/keys/account
2. PUT /api/v1/keys/backup
3. POST /api/v1/users/onboarding
```

#### Invariants:
- If any operation fails, onboarding remains **incomplete** (`onboardingCompleted: false`).
- Retrying must **reuse the existing keypair from IndexedDB** rather than generating a new one. Generating a different keypair would orphan messages encrypted for the previous public key.
- `PUT /api/v1/keys/account` is **idempotent for the exact same public key**, but returns `409 KEY_ALREADY_REGISTERED` if a different public key is submitted.
- `POST /api/v1/users/onboarding` finalizes onboarding in PostgreSQL and marks `onboardingCompleted = true`.

---

## 3. New Chat-Key Backup Model

The random 24-word recovery key model from previous drafts is completely removed and replaced by a passphrase-encrypted private-key backup.

### 3.1 Database Schema (`key_backups` Table)

| Column | Type | Purpose | Constraints |
|---|---|---|---|
| `user_id` | `UUID` | Primary key & user reference | PK, FK `users.id` ON DELETE CASCADE |
| `encrypted_private_key` | `TEXT` | Passphrase-encrypted private scalar | Base64 (48 bytes = 64 characters) |
| `nonce` | `TEXT` | Secretbox nonce | Base64 (24 bytes = 32 characters) |
| `kdf_salt` | `TEXT` | Argon2id salt | Base64 (16 bytes = 24 characters) |
| `version` | `INTEGER` | Backup format & KDF config version | Default `1` |
| `updated_at` | `TIMESTAMPTZ` | Timestamp of last backup update | Default `now()` |

### 3.2 Backup Version 1 KDF Specification

The KDF parameters are tied to the backup `version`:

- **Algorithm**: Argon2id (`crypto_pwhash_ALG_ARGON2ID13`)
- **Ops Limit**: `crypto_pwhash_OPSLIMIT_INTERACTIVE` (2 passes)
- **Mem Limit**: `crypto_pwhash_MEMLIMIT_INTERACTIVE` (64 MB)
- **Salt Length**: 16 raw bytes (24 base64 characters)
- **Derived Key**: 32 raw bytes (for `crypto_secretbox`)
- **Cipher**: XSalsa20-Poly1305 (`crypto_secretbox_easy`)

> **Important**: Any future modification to Argon2id parameters or cipher primitives requires incrementing `version` (e.g. `version = 2`) with an explicit migration and backward-compatibility strategy.

---

## 4. Unlocking After Login

When a user signs in on any device, the frontend evaluates their cryptographic state before granting access to conversation threads.

### 4.1 State Machine Matrix

| Server Public Key | Local Key in IndexedDB | Client Action / Route |
|---|---|---|
| **Missing (`404`)** | Any | Route to **Protect your chats** (finish onboarding / key setup). |
| **Exists (`200`)** | **Matches Server Key** | User is fully unlocked. Proceed directly into the app. |
| **Exists (`200`)** | **Missing** | Fetch backup (`GET /api/v1/keys/backup`), display **Unlock your chats** modal. |
| **Exists (`200`)** | **Differs from Server** | Corrupted / stale local key. Prompt user to unlock from server backup. |

### 4.2 Passphrase Verification Flow (100% Client-Side)

1. Client fetches `{ encryptedPrivateKey, nonce, kdfSalt, version }` from `GET /api/v1/keys/backup`.
2. User enters passphrase into the client UI.
3. Client runs Argon2id KDF on the passphrase + `kdfSalt`.
4. Client attempts `crypto_secretbox_open_easy(ciphertext, nonce, derivedKey)`.
   - **If decryption fails**: Show `"Incorrect passphrase"`. Allow retry without server involvement.
   - **If decryption succeeds**:
     1. Client computes public scalar from decrypted private scalar via `crypto_scalarmult_base(privateKey)`.
     2. Verifies computed public key matches the public key registered on the server.
     3. Saves private key into IndexedDB.
     4. Sets in-memory `chatUnlocked = true`.

---

## 5. Logout & Private-Device Behavior

### 5.1 "This is my private device" Preference
- The login and registration screens provide a checkbox: **"This is my private device"**.
- This preference is stored strictly **per-device in `localStorage`**, never as an account-wide server setting.

### 5.2 Mandatory Logout Actions

On logout (invoking `POST /api/v1/auth/logout`):

1. **Authentication State**: Clear access tokens, refresh cookies, and user session records.
2. **Query & HTTP Cache**: Flush React Query / Apollo / SWR in-memory and persisted query caches.
3. **Decrypted Message Data**: Purge all decrypted message plaintexts, typing statuses, and ephemeral conversation keys from memory and DOM.
4. **Key Storage Handling**:
   - **If private device**: Retain the account private key in IndexedDB so the user does not have to re-enter their passphrase on next login.
   - **If NOT private device (shared/public)**: **Delete the private key from IndexedDB**. Next login will require entering the passphrase to restore from backup.
   
> **Critical Rule**: Retaining a private key in IndexedDB on a private device **never** retains decrypted messages. Plaintext chat history must always be cleared from memory on logout.

---

## 6. Settings & Passphrase Management

### 6.1 Change Passphrase
- **Pre-requisite**: User must have an **unlocked chat key** currently in memory.
- **Workflow**:
  1. User enters current passphrase and new passphrase.
  2. Frontend verifies current passphrase locally.
  3. Frontend validates new passphrase strength (`zxcvbn`).
  4. Generates a fresh random 16-byte `kdfSalt` and 24-byte `nonce`.
  5. Encrypts the **same existing private key** with the new passphrase.
  6. Sends updated backup via `PUT /api/v1/keys/backup`.
  7. **Preserves the account keypair**: The public key in `user_keys` is untouched. Past messages remain decryptable.

### 6.2 Forgot Passphrase
- The UI must provide an honest, transparent explanation:
  > *"Because your chats are end-to-end encrypted, neither Comfort nor anyone else can reset your passphrase. If you lose your passphrase and do not have an active device, past encrypted chats cannot be recovered."*
- **Future Action**: A future `"Start fresh"` action will allow generating a new keypair and resetting conversations. *(Out of scope for current API release).*

---

## 7. Deprecation of Previous Recovery-Key Approach

The following components from earlier PRD revisions are **completely removed**:
- ❌ Random 24-word recovery key generation.
- ❌ "Show recovery key once" UI modals.
- ❌ Recovery key confirmation quiz steps.
- ❌ Recovery-key-based envelope encryption.

**Replacement**: Passphrase-based Argon2id backup model with zero-knowledge server storage.

---

## 8. Cryptographic Implementation Guidelines

### 8.1 Key Verification & Scalar Representation
- Public keys must be derived from the private scalar strictly via:
  ```ts
  const derivedPublicKey = sodium.crypto_scalarmult_base(privateKey);
  ```
- Public and private keys must consistently use `Uint8Array` internally and **Standard Base64** for API transmission.
- Automated tests must prove that generating a keypair, backing it up with a passphrase, and restoring it yields the exact identical public key.

### 8.2 Memory Handling & Zeroing
Both `createBackup` and `restoreBackup` routines must use `try / finally` blocks to overwrite sensitive key buffers in memory:
```ts
let derivedKey: Uint8Array | null = null;
try {
  derivedKey = deriveKey(passphrase, salt);
  // encrypt or decrypt
} finally {
  if (derivedKey) sodium.memzero(derivedKey);
}
```

### 8.3 Input & Blob Validation
Before invoking decryption, the client and server must validate:
- `publicKey`: Exactly 32 bytes (44 chars Base64), non-zero.
- `encryptedPrivateKey`: Exactly 48 bytes (64 chars Base64).
- `nonce`: Exactly 24 bytes (32 chars Base64).
- `kdfSalt`: Exactly 16 bytes (24 chars Base64).
Malformed payloads must fail with controlled validation errors rather than throwing uncontrolled cryptographic panics.

### 8.4 Content Security Policy (CSP) & Storage Safety
IndexedDB holds private scalars. While protected by origin isolation, the frontend must enforce strict CSP headers:
- `default-src 'self'`
- `script-src 'self'` (no `'unsafe-inline'`, no `'unsafe-eval'`)
- `connect-src 'self' http://localhost:3000 wss://localhost:3000`

---

## 9. API Specification Matrix (Keys & Onboarding)

### 9.1 Key Management Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PUT` | `/api/v1/keys/account` | `Bearer` + Active | Registers public key. Idempotent for same key; returns `409 KEY_ALREADY_REGISTERED` if differing key sent. |
| `GET` | `/api/v1/keys/account` | `Bearer` + Active | Retrieves registered public key. |
| `PUT` | `/api/v1/keys/backup` | `Bearer` + Active | Upserts passphrase-encrypted private key backup (`encryptedPrivateKey`, `nonce`, `kdfSalt`). |
| `GET` | `/api/v1/keys/backup` | `Bearer` + Active | Retrieves encrypted backup for device unlock / recovery. |
| `POST` | `/api/v1/keys/link-requests` | `Bearer` + Active | Creates a 5-minute ephemeral pairing request for a new device. |
| `GET` | `/api/v1/keys/link-requests/:id` | `Bearer` + Active | Polled by new device; consumes and erases payload upon approval. |
| `POST` | `/api/v1/keys/link-requests/:id/approve` | `Bearer` + Active | Approved by existing device, transmitting sealed key payload. |

### 9.2 Onboarding Endpoint

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/users/onboarding` | `Bearer` | Validates profile & privacy settings; marks `onboardingCompleted: true`. Requires keys setup completed first. |

---

## 10. Implementation Scope & Verification Checklist

- [x] **Database Schema**: `key_backups` table contains `user_id`, `encrypted_private_key`, `nonce`, `kdf_salt`, `version`, `updated_at`.
- [x] **Account Key Idempotency**: `PUT /keys/account` returns `409 KEY_ALREADY_REGISTERED` on key mismatch.
- [x] **Backup Upsert**: `PUT /keys/backup` accepts `kdfSalt` (16 bytes base64) and updates without replacing the public key.
- [x] **Frontend Key Persistence**: Keypair stored in IndexedDB immediately upon generation.
- [x] **Private Device Support**: Logout selectively preserves IndexedDB key based on client-side preference while clearing decrypted chats.
- [x] **Postman & Documentation**: Updated collection and endpoint docs reflect `kdfSalt`, `targetType` reports, and onboarding sequence.

