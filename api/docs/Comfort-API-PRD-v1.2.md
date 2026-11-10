# Comfort API — Product and Technical Requirements Document
**Project:** comfort-api  
**Document Version:** 1.2  
**Owner:** Fortune Okpara  
**Status:** Approved for Implementation  
**Target:** MVP Complete  
**Consumer:** comfort-frontend (React, TypeScript, Vite, Tailwind CSS v4)  
**Date:** November 2026  

---

## 1. Purpose & Goals

`comfort-api` is the backend server for **Comfort**, a peer mental wellness and kindness platform. It authenticates users, stores posts and Comforts, manages end-to-end encrypted private conversations, and delivers real-time updates via WebSockets.

### 1.1 Core Goals
1. **End-to-End Kindness Journey**: Seamless support for posting thoughts, sending and receiving anonymous or attributed Comforts, envelope opening reveal, appreciation responses, and private real-time conversations.
2. **True Anonymity Guarantees**: Anonymity is cryptographically and server-enforced, never just a client-side visual disguise.
3. **Dual Encryption Architecture**:
   - **Comforts at Rest**: Server-side AES-256-GCM encryption with versioned keys (`AT_REST_KEY_V1`).
   - **Conversations**: Client-side End-to-End Encryption (E2EE via `libsodium-wrappers`), where the server only ever stores and routes ciphertext.
4. **Stateless JWT Authentication**: Dual-token (short-lived Access JWT + long-lived HttpOnly Refresh Cookie) with database `token_version` for instant revocation on password change or logout.
5. **Type Safety & Data Integrity**: End-to-end TypeScript with **Drizzle ORM**, strict Zod schema validation for all inputs/environment, and migration management against PostgreSQL (Neon).

### 1.2 Non-Goals (MVP)
Public likes, vanity follower counts, comments, bookmarks, Explore tab, media attachments in chat (initials-only avatars across the platform), voice/video calls, complex Double Ratchet, or clinical therapy claims.

---

## 2. Product Rules Enforced by API

| # | Rule Description | Enforcement Layer |
|---|---|---|
| **R1** | Anonymity is chosen per post and per Comfort. | Database boolean flags (`is_anonymous`). |
| **R2** | Author/sender ID is stored internally for safety/moderation; never serialized in public responses for anonymous content. | `public-identity.ts` sanitizer. |
| **R3** | A Comfort has exactly one recipient derived from the target post's author; never client-provided. | Server controller / service. |
| **R4** | Users cannot send Comforts to themselves. | Service validation (`sender_id !== post.author_id`). |
| **R5** | Sending a Comfort does not start a conversation; only the recipient can initiate a conversation from a received Comfort. | Service state machine. |
| **R6** | Exactly one conversation per initiating Comfort. | Unique constraint on `conversations.comfort_id`. |
| **R7** | `opened_at` is set once on first open. Returns `wasAlreadyOpened` boolean so frontend plays envelope animation once. | Atomic database update. |
| **R8** | Only the intended recipient can open a Comfort or send an appreciation pill. | Authorization guard. |
| **R9** | Only conversation participants can send or read message ciphertext. | Conversation membership check. |
| **R10** | Chat content is E2EE. The server stores and routes ciphertext only (`node:crypto` cannot decrypt). | API contract & schema. |
| **R11** | Blocks are enforced server-side across Comforts, conversations, feeds, and profiles. | Repository query filters. |
| **R12** | Anonymous posts never appear on public user profile endpoints (`/users/:username/posts`). | Query filter (`is_anonymous = false`). |
| **R13** | Appreciation response is allowed only once per Comfort, only after opening, and is private between parties. | Service validation & database constraint. |

---

## 3. Architecture & File Layout

### 3.1 Modular Monolith Structure
The application cleanly separates bootstrapping (`server.ts`), application middleware wiring (`app.ts`), modular domain routes, and database access:

```
api/
├── .env                          # Local environment secrets (gitignored)
├── .env.example                  # Environment template
├── .gitignore
├── .npmrc                        # save-exact=true, build configs
├── package.json                  # Pinned dependencies & scripts
├── tsconfig.json                 # TypeScript NodeNext ESM config
├── eslint.config.js              # Flat ESLint + eslint-plugin-security
├── docs/                         # Specifications & PRD
│   ├── Comfort-API-PRD-v1.2.md
│   └── ...
├── tests/                        # Vitest / Supertest integration suites
└── src/
    ├── server.ts                 # HTTP server bootstrap, graceful shutdown, Socket.IO
    ├── app.ts                    # Express createApp() factory & middleware pipeline
    ├── config/
    │   ├── env.ts                # Zod-validated environment runtime configuration
    │   ├── redis.ts              # Redis client & Socket.IO adapter configuration
    │   └── crypto.ts             # AES-256-GCM symmetric cipher helpers
    ├── db/
    │   ├── index.ts              # Drizzle ORM client initialization (Neon/Postgres)
    │   ├── schema.ts             # Drizzle table definitions & indexes
    │   ├── relations.ts          # Drizzle relational queries
    │   ├── seed.ts               # Local development seed script
    │   └── migrations/           # Drizzle migration SQL files
    ├── modules/
    │   ├── auth/                 # Register, login, refresh, logout, Google, reset
    │   ├── users/                # Profile management, preferences, blocklists
    │   ├── posts/                # Post creation, feeds, author lookups
    │   ├── comforts/             # Comfort delivery, envelope reveal, appreciation
    │   ├── conversations/        # E2EE conversation threads & ciphertext messages
    │   ├── keys/                 # Public key exchange & encrypted key backup
    │   ├── notifications/        # In-app alerts & badges
    │   ├── blocks/               # Blocking rules & blocked user management
    │   └── reports/              # Content reporting & safety audits
    ├── middleware/
    │   ├── authenticate.ts       # Bearer JWT access token authentication
    │   ├── optional-auth.ts      # Optional authentication for public/hybrid feeds
    │   ├── origin-guard.ts       # Strict Origin verification on mutating routes
    │   ├── rate-limit.ts         # IP & user-based rate limiters (Redis-backed)
    │   ├── request-id.ts         # Request UUID tracing
    │   └── validate.ts           # Zod schema validation middleware
    ├── services/
    │   ├── email.service.ts      # Nodemailer transactional email delivery
    │   └── storage.service.ts    # Cloudinary asset storage (if needed)
    ├── sockets/
    │   ├── index.ts              # Socket.IO connection & event dispatchers
    │   └── socket-auth.ts        # Handshake Bearer token authenticator
    ├── utils/
    │   ├── jwt.ts                # Access/refresh token signing & verification
    │   ├── api-response.ts       # Standardized JSON response formatting
    │   ├── pagination.ts         # Cursor-based pagination utilities
    │   └── public-identity.ts    # Safe author/sender anonymization sanitizer
    ├── shared/
    │   ├── errors.ts             # ApiError hierarchy & safeErrorInfo serializer
    │   ├── logger.ts             # Redacted Pino logger instance
    │   ├── origin-guard.ts       # Origin verification
    │   └── http/
    │       └── error-handler.ts  # Global Express error handler
    └── types/
        └── express.d.ts          # Global Express Request augmentations (requestId, user)
```

### 3.2 Middleware Execution Order (`app.ts`)
1. **Trust Proxy**: Configured via `env.TRUST_PROXY` for accurate reverse-proxy IP tracking.
2. **Helmet**: Secure HTTP response headers (CSP, Referrer-Policy: `no-referrer`, HSTS).
3. **CORS**: Explicit whitelist matching `env.FRONTEND_URL` with `credentials: true`.
4. **Cookie Parser**: Secure cookie parsing for refresh tokens (`comfort_rt`).
5. **Compression**: Gzip/Deflate response compression.
6. **Body Parsers**: `express.json({ limit: "1mb" })` and `express.urlencoded({ extended: true, limit: "1mb" })`.
7. **HPP**: HTTP Parameter Pollution protection.
8. **Logging**: Pino HTTP / Morgan access logs (redacting headers, passwords, ciphertext).
9. **Origin Guard**: CSRF prevention verifying incoming `Origin` on all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
10. **Global Rate Limiter**: IP-based rate limiting via Redis.
11. **API Router**: Mounted under `/api/v1` (with `/api/health` top-level health probe).
12. **Global Error Handler**: `errorHandler` converting errors into standardized JSON while scrubbing internal database traces.

---

## 4. Technology Stack & Dependencies

| Area | Technology | Purpose / Justification |
|---|---|---|
| **Runtime** | Node.js 20+ LTS | ESM-native JavaScript execution |
| **Language** | TypeScript 5.7+ | Strict typing, NodeNext resolution, zero `any` in core logic |
| **Framework** | Express 4.x | Fast, lightweight HTTP request routing |
| **Database** | PostgreSQL 15+ (Neon) | ACID transactions, pooled runtime queries & unpooled migration runner |
| **ORM** | **Drizzle ORM & Drizzle Kit** | Type-safe SQL dialect, zero runtime bloat, automated SQL schema migrations |
| **Auth** | **JWT (`jsonwebtoken`) + Argon2id** | Stateless Bearer access token + HttpOnly refresh cookie + Argon2id password hashing |
| **Realtime** | Socket.IO 4.x + Redis Adapter | Horizontal WebSocket broadcast for chat and notifications |
| **Validation** | Zod 3.24+ | Strict runtime validation for request bodies, query params, and environment variables |
| **Logging** | Pino 9.x + Pino-Pretty | Structured JSON logging with automated credential/token redaction |
| **Build Tooling**| TSX & Tsup | Ultra-fast TypeScript execution in development and ESM bundling for production |

---

## 5. Configuration & Environment Variables

All variables are strictly validated by Zod at startup in `src/config/env.ts`. Any missing or malformed variable terminates the process immediately.

```env
# Runtime
NODE_ENV=development|test|production
PORT=5000
TRUST_PROXY=0
LOG_LEVEL=info|debug|warn|error

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-pooler.region.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep.region.neon.tech/neondb?sslmode=require
TEST_DATABASE_URL=postgresql://user:pass@ep-test.region.neon.tech/neondb?sslmode=require

# Redis (Optional in local dev, required in production)
REDIS_URL=redis://localhost:6379

# Client URL (for CORS and Origin Guard)
FRONTEND_URL=http://localhost:5173

# Authentication (JWT)
JWT_ACCESS_SECRET=64_char_minimum_random_secret_key
JWT_REFRESH_SECRET=64_char_minimum_random_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_COOKIE_NAME=comfort_rt

# Symmetric Cryptography at Rest (Comforts)
AT_REST_KEY_V1=base64_encoded_32_byte_symmetric_key
AT_REST_ACTIVE_KEY_VERSION=1

# External Services
GOOGLE_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

---

## 6. Data Model (Drizzle Schema)

Managed via `src/db/schema.ts` and tracked in `src/db/migrations/`:

```mermaid
erDiagram
    users ||--o{ posts : authors
    users ||--o{ comforts : sends
    users ||--o{ comforts : receives
    users ||--o{ user_blocks : blocks
    posts ||--o{ comforts : prompts
    comforts ||--o| conversations : initiates
    conversations ||--o{ messages : contains
    users ||--o{ user_keys : owns

    users {
        uuid id PK
        varchar email UK
        varchar username UK
        varchar display_name
        text password_hash
        varchar google_sub UK
        integer token_version
        varchar messaging_preference
        boolean is_onboarded
        timestamp created_at
        timestamp updated_at
    }

    posts {
        uuid id PK
        uuid author_id FK
        text content
        varchar category
        boolean is_anonymous
        timestamp created_at
        timestamp updated_at
    }

    comforts {
        uuid id PK
        uuid post_id FK
        uuid sender_id FK
        uuid recipient_id FK
        text encrypted_content
        integer key_version
        boolean is_anonymous
        timestamp opened_at
        varchar appreciation_code
        timestamp appreciated_at
        timestamp created_at
    }

    conversations {
        uuid id PK
        uuid comfort_id FK
        uuid participant_one FK
        uuid participant_two FK
        boolean is_locked
        timestamp created_at
        timestamp updated_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text encrypted_payload
        timestamp created_at
    }

    user_keys {
        uuid id PK
        uuid user_id FK
        text public_identity_key
        text encrypted_private_key
        text recovery_salt
        timestamp created_at
    }

    user_blocks {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
        timestamp created_at
    }
```

---

## 7. Authentication & Token Lifecycle

### 7.1 Stateless JWT Architecture
1. **Access Token (`JWT`)**:
   - Short-lived (`15 minutes`).
   - Carried in the `Authorization: Bearer <token>` HTTP header and Socket.IO handshake `auth.token`.
   - Payload:
     ```json
     {
       "sub": "user_uuid",
       "username": "alex",
       "tokenVersion": 1,
       "iat": 1700000000,
       "exp": 1700000900
     }
     ```
   - Verified statelessly in memory using `JWT_ACCESS_SECRET`.
2. **Refresh Token (`JWT` in HttpOnly Cookie)**:
   - Long-lived (`7 days`).
   - Stored in an `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/api/v1/auth` cookie named `comfort_rt`.
   - Verified using `JWT_REFRESH_SECRET`.
3. **Instant Revocation via `token_version`**:
   - Each user record carries an integer `token_version` (starts at `1`).
   - Changing a password, requesting "sign out everywhere", or deleting an account executes `UPDATE users SET token_version = token_version + 1 WHERE id = $1`.
   - The `/auth/refresh` endpoint validates that `token.tokenVersion === dbUser.token_version`. If versions do not match, the token is rejected and the cookie is purged.

### 7.2 Google Identity Services Flow
1. Frontend initiates Google OAuth using Google Identity Services (GIS) and obtains an ID token.
2. Frontend posts `POST /api/v1/auth/google { idToken }`.
3. Server validates audience, signature, and issuer with Google's public keys via `google-auth-library`.
4. Matches existing user by `google_sub` or verified email address.
5. Issues Access Token + Refresh Cookie; sets `is_onboarded=false` if first-time user so frontend directs to `/onboarding`.

---

## 8. Cryptography Specifications

### 8.1 Comforts: AES-256-GCM at Rest
- Server encrypts comfort message content before writing to PostgreSQL.
- Algorithm: `aes-256-gcm`.
- Storage: base64 payload containing `iv` (12 bytes), `authTag` (16 bytes), and `ciphertext`.
- Key management: Derived from `AT_REST_KEY_V1`. Key versions tracked to enable future key rotation.

### 8.2 Conversations: End-to-End Encryption (E2EE)
- Built on `libsodium-wrappers` in the web frontend.
- Symmetric ratcheted conversation keys or public key envelope encryption (`crypto_box_seal`).
- The API receives and stores only base64 ciphertext in `messages.encrypted_payload`.
- The server never has access to the user's plaintext private identity key or conversation keys.

---

## 9. API Endpoint Reference

All endpoints prefixed with `/api/v1` (except `/api/health`).

### 9.1 Authentication (`/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register with email, username, password. Returns Access Token + sets Refresh Cookie. |
| `POST` | `/auth/login` | Public | Password login with Argon2id verification and account lockout protections. |
| `POST` | `/auth/google` | Public | Google ID Token sign-in/up. |
| `POST` | `/auth/refresh` | Cookie | Exchanges valid `comfort_rt` cookie for fresh 15-minute Access Token. |
| `POST` | `/auth/logout` | Authenticated | Clears `comfort_rt` cookie and revokes session. |
| `GET` | `/auth/me` | Authenticated | Returns authenticated user profile, settings, and onboarding status. |
| `POST` | `/auth/change-password` | Authenticated | Changes password and increments `token_version`. |
| `POST` | `/auth/forgot-password` | Public | Initiates password reset email (constant-time response). |
| `POST` | `/auth/reset-password` | Public | Consumes single-use reset token and updates password. |

### 9.2 Comforts (`/comforts`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/comforts` | Authenticated | Sends an encrypted Comfort to post author. Enforces R3, R4, R11. |
| `GET` | `/comforts/received` | Authenticated | Paginated list of Comforts received by current user. |
| `GET` | `/comforts/sent` | Authenticated | Paginated list of Comforts sent by current user. |
| `GET` | `/comforts/:id` | Authenticated | Fetches details and decrypts at rest. Sets `opened_at` on first read (R7). |
| `POST` | `/comforts/:id/appreciate`| Authenticated | Submits appreciation pill (`THANK_YOU`, `HELPED`, etc.). Enforces R13. |

### 9.3 Posts (`/posts`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/posts` | Optional | Feed of recent posts. Filters out anonymous author IDs and blocked users. |
| `POST` | `/posts` | Authenticated | Creates a new post (supports `is_anonymous: true`). |
| `GET` | `/posts/:id` | Optional | Gets single post with sanitized author identity. |
| `PUT` | `/posts/:id` | Authenticated | Edits author's own post. |
| `DELETE`| `/posts/:id` | Authenticated | Deletes author's own post. |

### 9.4 Conversations & Chat (`/conversations`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/conversations` | Authenticated | Recipient starts conversation from a received Comfort (R5, R6). |
| `GET` | `/conversations` | Authenticated | Lists user's active conversations with preview and unread counts. |
| `GET` | `/conversations/:id/messages`| Authenticated | Paginated list of E2EE encrypted message payloads (R9, R10). |
| `POST` | `/conversations/:id/messages`| Authenticated | Posts a new E2EE message ciphertext. Dispatches Socket.IO event. |

### 9.5 Safety & Settings (`/users`, `/blocks`, `/reports`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/:username` | Optional | Public profile (never returns anonymous posts). |
| `PUT` | `/users/profile` | Authenticated | Updates display name, username, bio (no photo upload; initials avatar). |
| `PUT` | `/users/preferences` | Authenticated | Updates messaging preferences (`EVERYONE`, `CONNECTED`, `PAUSED`). |
| `GET` | `/blocks` | Authenticated | Lists blocked users. |
| `POST` | `/blocks/:userId` | Authenticated | Blocks a user and locks active conversations. |
| `DELETE`| `/blocks/:userId` | Authenticated | Unblocks a user. |
| `POST` | `/reports` | Authenticated | Reports inappropriate content or abusive behavior. |

---

## 10. Real-Time Events (Socket.IO)

- **Authentication**: JWT token passed during connection handshake:
  ```javascript
  const socket = io(API_URL, {
    auth: { token: `Bearer ${accessToken}` }
  });
  ```
- **Rooms**:
  - `user:<userId>`: Personal alerts (new Comfort received, appreciation received).
  - `conversation:<conversationId>`: Active conversation room for encrypted message delivery and typing indicators.
- **Events**:
  - `message:new`: Broadcasts `{ messageId, conversationId, senderId, ciphertext, createdAt }`.
  - `typing:status`: Transient typing indicator broadcast.
  - `comfort:received`: Notifies recipient that a new Comfort envelope arrived.

---

## 11. Security & Compliance Checklist

- [x] **No Hardcoded Secrets**: Everything loaded through `config/env.ts` with Zod parsing.
- [x] **Safe Error Logging**: `safeErrorInfo()` strips SQL queries, parameters, and system paths before Pino writes log records.
- [x] **Origin Verification**: `originGuard` checks `req.headers.origin` against `FRONTEND_URL` on all non-safe HTTP methods.
- [x] **Brute-Force Protection**: Rate limiting with Redis store on sensitive endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`).
- [x] **Parameter Pollution**: `hpp()` middleware active.
- [x] **Tamper-Proof Sessions**: High-entropy JWT secrets with cryptographic signature verification.
- [x] **Initials-Only Avatars**: No file upload endpoint required for avatars; SVG initials avatar rendered client-side.

---

## 12. Decision Log

| ID | Decision | Rationale |
|---|---|---|
| **D01** | **Drizzle ORM over Prisma/TypeORM** | Minimal overhead, zero query engine binary issues in serverless/containers, native TypeScript SQL builder with explicit schema control. |
| **D02** | **Stateless JWT + Refresh Cookie over Express-Session** | Eliminates Redis/Postgres session store lookup bottleneck on every API hit, simplifies WebSocket authentication, and allows zero-latency mobile/PWA integration. |
| **D03** | **`token_version` for Revocation** | Retains stateless benefits for normal requests while providing single-query instant revocation of all active tokens on password change or logout. |
| **D04** | **Server.ts & App.ts Separation** | Decouples Express middleware assembly (`app.ts`) for clean unit/integration testing with Supertest from runtime socket/process binding (`server.ts`). |
| **D05** | **No Profile Picture Uploads** | Privacy-first social app constraint. Initials avatars eliminate avatar scraping and offensive image upload risks. |
| **D06** | **AES-256-GCM for Comforts at Rest** | Balances recipient discovery & server-side comfort counter metrics while ensuring database leaks do not expose plaintext kindness messages. |

