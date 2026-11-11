# Comfort API — Endpoint & Testing Reference

**Base URL:** `http://localhost:3000`  
**Environment:** Development  
**Auth Scheme:** Bearer Access Token (Header: `Authorization: Bearer <token>`) + HttpOnly Refresh Cookie (`comfort_rt`)

---

## 📋 Recommended Testing Sequence in Postman

```
1.  GET    /api/health                       (Verify API is up)
2.  POST   /api/v1/auth/register             (Create user with email & password)
3.  POST   /api/v1/users/onboarding          (Submit display name, username, bio, privacy)
4.  GET    /api/v1/auth/me                   (Verify onboardingCompleted is true)
5.  POST   /api/v1/blocks                    (Block target user by username)
6.  GET    /api/v1/blocks                    (List blocked users & auto-save blockId)
7.  DELETE /api/v1/blocks/:id                (Unblock user using saved blockId)
8.  POST   /api/v1/comforts/:id/block        (Block comfort sender directly from message)
9.  PATCH  /api/v1/auth/change-password     (Change password)
10. POST   /api/v1/auth/refresh              (Rotate refresh token via cookie)
11. POST   /api/v1/auth/logout               (Invalidate session and clear cookie)
12. POST   /api/v1/auth/login                (Sign back in)
```

---

## 1. System & Health

### `GET /api/health`
Checks whether the Express server and routing are operational.
- **Auth:** None (Public)
- **Headers:** None
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "status": "ok",
  "message": "Comfort API running 💙"
}
```

---

## 2. Authentication Flow

### `POST /api/v1/auth/register`
Creates a new account. Registration accepts **email and password only**.
- **Auth:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "mypassword123"
}
```
> **Rules:**
> - `email`: Valid email format, max 254 chars.
> - `password`: Minimum 10 characters, maximum 128 characters.
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
      "email": "alex@example.com",
      "emailVerified": false,
      "hasPassword": true,
      "onboardingCompleted": false,
      "profile": {
        "displayName": null,
        "username": null,
        "bio": null,
        "avatarUrl": null
      },
      "settings": {
        "notifyNewComforts": true,
        "notifyNewMessages": true,
        "notifyAppreciation": true,
        "appearance": "system",
        "allowPrivateMessages": "allowed",
        "discoverableProfile": true
      }
    }
  }
}
```
*(Also sets `Set-Cookie: comfort_rt=...; HttpOnly; SameSite=Lax; Path=/api/v1/auth`)*

- **Error Response — Duplicate Email (`409 Conflict`):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Unable to complete registration with the provided information. If you already have an account, please sign in."
}
```

---

### `POST /api/v1/users/onboarding`
*(Alias: `POST /api/v1/onboarding`)*  
Separate authenticated step where the user sets up their public profile and privacy choices.
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "displayName": "Alex Rivera",
  "username": "alex_rivera",
  "bio": "Finding peace and quiet here.",
  "discoverableProfile": true,
  "allowPrivateMessages": "allowed"
}
```
> **Field options supported:**
> - `displayName` (Required): 1–50 characters.
> - `username` (Required): 3–20 characters, lowercase letters, numbers, underscore only. Must start with a letter. Reserved usernames (`admin`, `support`, etc.) are blocked.
> - `bio` (Optional): max 160 characters.
> - `discoverableProfile` or `discoverable`: `true` | `false` (default: `true`).
> - `allowPrivateMessages`: `"allowed"` | `"requests_only"` | `"off"` (or pass `allowMessageRequests: true/false`).

- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Onboarding completed",
  "data": {
    "user": {
      "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
      "email": "alex@example.com",
      "onboardingCompleted": true,
      "profile": {
        "displayName": "Alex Rivera",
        "username": "alex_rivera",
        "bio": "Finding peace and quiet here.",
        "avatarUrl": null
      },
      "settings": {
        "discoverableProfile": true,
        "allowPrivateMessages": "allowed"
      }
    }
  }
}
```

- **Error Response — Username Taken (`409 Conflict`):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Username is already taken",
  "errors": [
    {
      "path": "username",
      "message": "Username is unavailable"
    }
  ]
}
```

- **Error Response — Already Completed (`409 Conflict`):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Onboarding has already been completed"
}
```

---

### `POST /api/v1/auth/login`
Authenticates an existing user via email and password.
- **Auth:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "mypassword123"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
      "email": "alex@example.com",
      "emailVerified": false,
      "hasPassword": true,
      "onboardingCompleted": true,
      "profile": {
        "displayName": "Alex Rivera",
        "username": "alex_rivera",
        "bio": "Finding peace and quiet here.",
        "avatarUrl": null
      },
      "settings": { ... }
    }
  }
}
```

- **Error Response — Wrong Credentials or User Not Found (`401 Unauthenticated`):**
```json
{
  "success": false,
  "code": "UNAUTHENTICATED",
  "message": "Invalid credentials"
}
```

- **Error Response — Account Locked due to 5+ failed attempts (`429 Account Locked`):**
```json
{
  "success": false,
  "code": "ACCOUNT_LOCKED",
  "message": "Account temporarily locked"
}
```

---

### `GET /api/v1/auth/me`
Returns the currently authenticated user's profile, settings, and onboarding status.
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "user": {
      "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
      "email": "alex@example.com",
      "emailVerified": false,
      "hasPassword": true,
      "onboardingCompleted": true,
      "profile": {
        "displayName": "Alex Rivera",
        "username": "alex_rivera",
        "bio": "Finding peace and quiet here.",
        "avatarUrl": null
      },
      "settings": {
        "notifyNewComforts": true,
        "notifyNewMessages": true,
        "notifyAppreciation": true,
        "appearance": "system",
        "allowPrivateMessages": "allowed",
        "discoverableProfile": true
      }
    }
  }
}
```

---

### `POST /api/v1/auth/refresh`
Exchanges the valid HttpOnly refresh cookie (`comfort_rt`) for a fresh 15-minute access token. Performs automatic token rotation.
- **Auth:** Cookie (`comfort_rt`)
- **Headers:** None (In Postman, ensure cookies are enabled)
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

- **Error Response — Invalid / Expired / Reused Cookie (`401 Unauthorized`):**
```json
{
  "success": false,
  "code": "TOKEN_INVALID",
  "message": "Invalid refresh token"
}
```

---

### `POST /api/v1/auth/logout`
Revokes the current refresh token family and clears the `comfort_rt` cookie.
- **Auth:** Optional (`Authorization: Bearer {{accessToken}}`) + Cookie
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

---

### `GET /api/v1/auth/sessions`
Lists all active device sessions for the authenticated user.
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "e458fb2a-6052-47ef-b7eb-d1b46a788091",
        "deviceLabel": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "createdAt": "2026-11-09 12:00:00+00",
        "lastUsedAt": "2026-11-09 12:05:00+00",
        "current": true
      }
    ]
  }
}
```

---

### `DELETE /api/v1/auth/sessions/:id`
Terminates a specific session by its `familyId` UUID.
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Path Parameter:**
  - `:id` — The UUID of the session (from `GET /sessions`)
- **Body:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

---

### `PATCH /api/v1/auth/change-password` *(also accepts `POST`)*
Changes the user's password. Automatically revokes all existing refresh tokens and issues a fresh session.
- **Method:** `PATCH` or `POST`
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "currentPassword": "mypassword123",
  "newPassword": "mynewpassword456"
}
```
> **Rules:** `newPassword` must differ from `currentPassword` and have at least 10 chars.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### `POST /api/v1/auth/forgot-password`
Requests a password reset email. Always returns 200 to prevent email enumeration.
- **Auth:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "alex@example.com"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "If the email is registered, a reset link has been sent",
  "data": {}
}
```

---

### `POST /api/v1/auth/reset-password`
Consumes the single-use reset token from the reset email link and sets a new password.
- **Auth:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "token": "43_CHARACTER_BASE64URL_TOKEN_FROM_EMAIL",
  "password": "brandnewpassword789"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

---

### `POST /api/v1/auth/google`
Authenticates via a verified Google ID Token from Google Identity Services (GIS).
- **Auth:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFk..."
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
      "email": "alex@gmail.com",
      "emailVerified": true,
      "hasPassword": false,
      "onboardingCompleted": false,
      "profile": { ... },
      "settings": { ... }
    }
  }
}
```

---

## 3. Users & Profile

### `PATCH /api/v1/users/me/profile`
Updates the logged-in user's profile details (`displayName`, `username`, or `bio`).
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body (all fields optional, provide at least one):**
```json
{
  "displayName": "Alex Rivera",
  "username": "alex_rivera",
  "bio": "Updated bio: living mindfully."
}
```
> **Rules:**
> - `displayName`: 1–50 characters.
> - `username`: 3–20 characters, letters/numbers/underscore. Must be unique.
> - `bio`: Max 160 characters (send `""` to clear bio).
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "profile": {
      "displayName": "Alex Rivera",
      "username": "alex_rivera",
      "bio": "Updated bio: living mindfully.",
      "avatarUrl": null
    }
  }
}
```
- **Error Response — Username Taken (`409 Conflict`):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Username is already taken",
  "errors": [
    {
      "path": "username",
      "message": "Username is unavailable"
    }
  ]
}
```

---

### `GET /api/v1/users/:username`
Retrieves another user's public profile (or own profile).
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Path Parameter:**
  - `:username` — The username to look up (e.g. `/api/v1/users/alex_rivera`)
- **Privacy Enforcement:**
  - Returns `404 NOT_FOUND` if the user has `discoverableProfile: false` (unless viewing your own profile).
  - Returns `404 NOT_FOUND` if either user has blocked the other.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "profile": {
      "displayName": "Alex Rivera",
      "username": "alex_rivera",
      "bio": "Finding peace and quiet here.",
      "avatarUrl": null,
      "isSelf": false
    }
  }
}
```

---

### `DELETE /api/v1/users/me`
Permanently deletes the authenticated user's account. Requires password or Google ID token re-verification to prevent unauthorized deletion.
- **Auth:** Required (`Bearer <accessToken>`)
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body (Password accounts):**
```json
{
  "password": "mypassword123"
}
```
- **Request Body (Google accounts):**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```
- **What happens on deletion:**
  - Anonymizes / soft-deletes user record in database (`status = 'deleted'`).
  - Hides all author posts (`deletedAt = now()`).
  - Purges personal profile, keys, notifications, and reset tokens.
  - Revokes all refresh tokens and clears the `comfort_rt` HttpOnly cookie.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Account deleted",
  "data": {}
}
```
- **Error Response — Incorrect Password (`400 Bad Request`):**
```json
{
  "success": false,
  "code": "INVALID_CURRENT_PASSWORD",
  "message": "Current password is incorrect"
}
```

---

## 4. User Settings

### `GET /api/v1/settings` *(or `GET /api/v1/users/me/settings`)*
Retrieves the logged-in user's notifications, appearance, and privacy settings.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "settings": {
      "notifyNewComforts": true,
      "notifyNewMessages": true,
      "notifyAppreciation": true,
      "appearance": "system",
      "allowPrivateMessages": "allowed",
      "discoverableProfile": true
    }
  }
}
```

---

### `PATCH /api/v1/settings` *(or `PATCH /api/v1/users/me/settings`)*
Partially updates the user's settings.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body (all fields optional, provide at least one):**
```json
{
  "notifyNewComforts": true,
  "notifyNewMessages": true,
  "notifyAppreciation": false,
  "appearance": "dark",
  "allowPrivateMessages": "requests_only",
  "discoverableProfile": true
}
```
> **Enums:**
> - `appearance`: `"system"` | `"light"` | `"dark"`
> - `allowPrivateMessages`: `"allowed"` | `"requests_only"` | `"off"`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "settings": {
      "notifyNewComforts": true,
      "notifyNewMessages": true,
      "notifyAppreciation": false,
      "appearance": "dark",
      "allowPrivateMessages": "requests_only",
      "discoverableProfile": true
    }
  }
}
```

---

## 5. Posts & Community Feed Flow

Comfort posts are categorized supportive or reflective messages shared with the community. You can post either using your public identity or completely anonymously.

---

### `GET /api/v1/categories`
Retrieves available categories. You will need a category `id` (UUID) when creating a post.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "categories": [
      {
        "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
        "name": "Encouragement",
        "slug": "encouragement",
        "description": "Uplifting messages and gentle reminders."
      },
      {
        "id": "d2f838d7-3290-5dg7-0fcd-3805fc9590b3",
        "name": "Everyday Thoughts",
        "slug": "everyday-thoughts",
        "description": "Quiet moments and daily reflections."
      }
    ]
  }
}
```

---

### `POST /api/v1/posts`
Creates a new post in the feed.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 20 posts / hour per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "content": "Some days are harder than others, but remember that taking small steps forward is still progress. Be gentle with yourself today. 💙",
  "categoryId": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
  "isAnonymous": false
}
```
> **Rules:**
> - `content`: 1 to 2,000 characters. No control or unprintable characters.
> - `categoryId`: Valid UUID of an active category (from `GET /api/v1/categories`).
> - `isAnonymous`: Boolean. If `true`, your name and profile are hidden in public feeds.
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Post created",
  "data": {
    "post": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "content": "Some days are harder than others, but remember that taking small steps forward is still progress. Be gentle with yourself today. 💙",
      "createdAt": "2026-11-10T12:00:00.000Z",
      "isMine": true,
      "category": {
        "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
        "name": "Encouragement",
        "slug": "encouragement"
      },
      "author": {
        "displayName": "Alex Rivera",
        "username": "alexrivera",
        "avatarUrl": null,
        "isAnonymous": false
      }
    }
  }
}
```

---

### `GET /api/v1/posts` (View Feed)
Retrieves the community feed ordered from newest to oldest. Posts from blocked users and inactive accounts are automatically excluded.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 200 requests / 15 minutes per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Query Parameters (optional):**
  - `limit`: Integer (1 to 50, default `20`)
  - `cursor`: Opaque pagination string returned from previous page (`nextCursor`)
  - `category`: Category slug filter (e.g. `encouragement`, `everyday-thoughts`)
- **Example URL:** `http://localhost:3000/api/v1/posts?limit=20&category=encouragement`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "content": "Some days are harder than others...",
        "createdAt": "2026-11-10T12:00:00.000Z",
        "isMine": true,
        "category": {
          "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
          "name": "Encouragement",
          "slug": "encouragement"
        },
        "author": {
          "displayName": "Alex Rivera",
          "username": "alexrivera",
          "avatarUrl": null,
          "isAnonymous": false
        }
      }
    ],
    "nextCursor": "eyJ0cyI6IjIwMjYtMTEtM...",
    "hasMore": false
  }
}
```

---

### `GET /api/v1/posts/:id` (View Single Post)
Retrieves full details of a specific post.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **URL Parameter:**
  - `:id` — Post UUID
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "post": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "content": "Some days are harder than others...",
      "createdAt": "2026-11-10T12:00:00.000Z",
      "isMine": true,
      "category": {
        "id": "c1f727c6-218f-4cf6-9ebc-2794eb8489a2",
        "name": "Encouragement",
        "slug": "encouragement"
      },
      "author": {
        "displayName": "Alex Rivera",
        "username": "alexrivera",
        "avatarUrl": null,
        "isAnonymous": false
      }
    }
  }
}
```

---

### `GET /api/v1/users/me/posts` (View My Posts)
Lists all posts written by the logged-in user, including anonymous posts.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Query Parameters (optional):**
  - `limit`: Integer (1 to 50, default `20`)
  - `cursor`: Pagination cursor
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [ ... ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### `GET /api/v1/users/:username/posts` (View User Posts)
Lists named public posts by a specific user. Anonymous posts never appear here.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **URL Parameter:**
  - `:username` — Target user's username
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [ ... ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### `DELETE /api/v1/posts/:id`
Soft-deletes a post authored by the logged-in user.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 30 deletes / hour
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **URL Parameter:**
  - `:id` — Post UUID
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Post deleted",
  "data": {}
}
```

---

## 6. Blocks Flow

The blocking system enforces mutual invisibility:
- A blocked user's posts disappear from your feed.
- Your posts disappear from the blocked user's feed.
- Neither user can send comforts to the other's posts.
- Blocking an anonymous comfort sender blocks their underlying account **without exposing their identity** (listed as `Anonymous` with null username).

---

### `POST /api/v1/blocks`
Blocks a user by their public username.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 30 requests / hour per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "username": "jane_doe"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User blocked",
  "data": {
    "blocked": true
  }
}
```
- **Error Response — Self-Block (`422 Unprocessable Entity`):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "errors": [
    {
      "path": "username",
      "message": "You can't block yourself"
    }
  ]
}
```
- **Error Response — Target Not Found or Non-Discoverable (`404 Not Found`):**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found"
}
```

---

### `GET /api/v1/blocks`
Lists all users you currently have blocked (ordered newest first, limit 200).
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 120 requests / 15 minutes per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "e4a7a8d5-397a-4ecb-9d47-6d601b38cf4e",
        "user": {
          "displayName": "Jane Doe",
          "username": "jane_doe",
          "avatarUrl": null,
          "isAnonymous": false
        },
        "createdAt": "2026-11-10T11:00:00.000Z"
      },
      {
        "id": "f5b8b9e6-408b-5fdc-ae58-7e712c49da5f",
        "user": {
          "displayName": "Anonymous",
          "username": null,
          "avatarUrl": null,
          "isAnonymous": true
        },
        "createdAt": "2026-11-10T10:45:00.000Z"
      }
    ]
  }
}
```

---

### `DELETE /api/v1/blocks/:id`
Unblocks a user using the block entry UUID (obtained from `GET /api/v1/blocks`).
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 30 requests / hour per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **URL Parameter:**
  - `:id` — The UUID of the block record (e.g. `e4a7a8d5-397a-4ecb-9d47-6d601b38cf4e`)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "User unblocked",
  "data": {}
}
```
- **Error Response — Block Not Found (`404 Not Found`):**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Block not found"
}
```

---

### `POST /api/v1/comforts/:id/block`
Blocks the sender of a received comfort directly from the comfort message itself. If the comfort was anonymous, this blocks the author from ever contacting you or seeing your posts again while preserving their anonymity.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 30 requests / hour per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **URL Parameter:**
  - `:id` — The UUID of the received comfort message
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Sender blocked",
  "data": {
    "blocked": true
  }
}
```
- **Error Response — Comfort Not Found or Viewer is Not Recipient (`404 Not Found`):**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Comfort not found"
}
```

---

## 7. Reports Flow

The moderation reporting endpoint allows users to submit reports for harmful content or abusive behavior across posts, comforts, direct messages, and user profiles.

---

### `POST /api/v1/reports`
Submits a report for review.
- **Auth:** Required (`Bearer <accessToken>`) + `requireOnboarded`
- **Rate Limit:** 10 reports / hour per user
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`

#### Allowed Reasons:
`"harassment"` | `"hate_speech"` | `"self_harm"` | `"spam"` | `"inappropriate"` | `"impersonation"` | `"other"`  
*(Note: If `"other"` is selected, `description` is required).*

#### Target Types & Request Bodies:

1. **Reporting a Post:**
```json
{
  "targetType": "post",
  "targetId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "reason": "harassment",
  "description": "This post contains harmful or abusive language targeting a person."
}
```

2. **Reporting a Comfort Message:**
```json
{
  "targetType": "comfort",
  "targetId": "e4a7a8d5-397a-4ecb-9d47-6d601b38cf4e",
  "reason": "inappropriate",
  "description": "Unsolicited inappropriate content received in a comfort envelope."
}
```

3. **Reporting a User Profile:**
```json
{
  "targetType": "user",
  "username": "alexrivera",
  "reason": "impersonation",
  "description": "This account is impersonating an official platform administrator."
}
```

- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Report received",
  "data": {}
}
```
- **Error Response — Reporting Yourself (`422 Unprocessable Entity`):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "errors": [
    {
      "path": "target",
      "message": "You can't report yourself or your own content"
    }
  ]
}
```
- **Error Response — Target Not Found (`404 Not Found`):**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Report target not found"
}
```

---

## 8. Keys & Device Linking Flow (End-to-End Encryption)

The Keys module manages cryptographic account public keys, password-encrypted private key backups, and device-to-device pairing requests (zero-knowledge transfer of private keys between an existing device and a new device).

---

### `PUT /api/v1/keys/account`
Registers or verifies the user's primary public key (32 bytes base64, 44 characters).
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Rate Limit:** 10 requests / hour
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "publicKey": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
}
```
- **Success Response (`201 Created` on first set, `200 OK` on idempotency confirmation):**
```json
{
  "success": true,
  "message": "Account key saved",
  "data": {
    "publicKey": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "createdAt": "2026-11-10T12:00:00.000Z"
  }
}
```
- **Error Response — Key Mismatch (`409 Conflict`):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "An account key is already set"
}
```

---

### `GET /api/v1/keys/account`
Fetches the user's active public key.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "publicKey": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "createdAt": "2026-11-10T12:00:00.000Z"
  }
}
```

---

### `PUT /api/v1/keys/backup`
Uploads the client's password-encrypted private key blob and nonce.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Rate Limit:** 10 requests / hour
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "encryptedPrivateKey": "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC",
  "nonce": "AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD",
  "kdfSalt": "BQUFBQUFBQUFBQUFBQUFBQ=="
}
```
> **Rules:**
> - `encryptedPrivateKey`: 48 bytes base64 (64 characters).
> - `nonce`: 24 bytes base64 (32 characters).
> - `kdfSalt`: 16 bytes base64 (24 characters, Argon2id salt).
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Backup saved",
  "data": {
    "version": 1,
    "encryptedPrivateKey": "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC",
    "nonce": "AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD",
    "kdfSalt": "BQUFBQUFBQUFBQUFBQUFBQ==",
    "updatedAt": "2026-11-10T12:05:00.000Z"
  }
}
```

---

### `GET /api/v1/keys/backup`
Retrieves the encrypted private key backup for key recovery.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "version": 1,
    "encryptedPrivateKey": "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC",
    "nonce": "AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD",
    "kdfSalt": "BQUFBQUFBQUFBQUFBQUFBQ==",
    "updatedAt": "2026-11-10T12:05:00.000Z"
  }
}
```
    "updatedAt": "2026-11-10T12:05:00.000Z"
  }
}
```

---

### `POST /api/v1/keys/link-requests` (Initiate Pairing on New Device)
Initiates a 5-minute device link request with an ephemeral public key generated by the new device.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "ephemeralPublicKey": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Link request created",
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "pending",
    "expiresAt": "2026-11-10T12:15:00.000Z"
  }
}
```

---

### `GET /api/v1/keys/link-requests/:id` (Poll Status on New Device)
Polled by the new device. Once approved by the existing device, this call returns the `encryptedPayload` and automatically burns it from the server.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **URL Parameter:**
  - `:id` — Link request UUID
- **Pending Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "pending",
    "expiresAt": "2026-11-10T12:15:00.000Z"
  }
}
```
- **Approved Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "approved",
    "encryptedPayload": "BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ="
  }
}
```

---

### `POST /api/v1/keys/link-requests/:id/approve` (Approve on Existing Device)
Called by the user's logged-in device after comparing pairing codes / fingerprints to approve transferring the account secret.
- **Auth:** Required (`Bearer <accessToken>`) + `requireActive`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "encryptedPayload": "BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ="
}
```
> **Rules:**
> - `encryptedPayload`: 80 bytes base64 (108 characters).
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Device approved",
  "data": {
    "status": "approved"
  }
}
```

---

## 9. Postman Import File

A ready-to-import Postman collection is located at:  
👉 [`api/docs/Comfort-API.postman_collection.json`](file:///c:/Users/ADMIN/Desktop/comfort/api/docs/Comfort-API.postman_collection.json)

**To import:**
1. Open Postman.
2. Click **Import** (top left).
3. Drag and drop `api/docs/Comfort-API.postman_collection.json`.
4. Variables `{{baseUrl}}`, `{{accessToken}}`, `{{blockId}}`, `{{targetUsername}}`, `{{comfortId}}`, `{{postId}}`, `{{categoryId}}`, `{{linkRequestId}}`, and test keys are managed automatically. Running **Register** or **Login** auto-saves the token for all subsequent protected requests.

