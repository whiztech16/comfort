# Comfort API — Endpoint & Testing Reference

**Base URL:** `http://localhost:3000`  
**Environment:** Development  
**Auth Scheme:** Bearer Access Token (Header: `Authorization: Bearer <token>`) + HttpOnly Refresh Cookie (`comfort_rt`)

---

## 📋 Recommended Testing Sequence in Postman

```
1. GET  /api/health                       (Verify API is up)
2. POST /api/v1/auth/register             (Create user with email & password)
3. POST /api/v1/users/onboarding          (Submit display name, username, bio, privacy)
4. GET  /api/v1/auth/me                   (Verify onboardingCompleted is true)
5. GET  /api/v1/auth/sessions             (View active session)
6. PATCH /api/v1/auth/change-password     (Change password — accepts PATCH or POST)
7. POST /api/v1/auth/refresh              (Rotate refresh token via cookie)
8. POST /api/v1/auth/logout               (Invalidate session and clear cookie)
9. POST /api/v1/auth/login                (Sign back in with new password)
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

## 5. Postman Import File

A ready-to-import Postman collection is located at:  
👉 [`api/docs/Comfort-API.postman_collection.json`](file:///c:/Users/ADMIN/Desktop/comfort/api/docs/Comfort-API.postman_collection.json)

**To import:**
1. Open Postman.
2. Click **Import** (top left).
3. Drag and drop `api/docs/Comfort-API.postman_collection.json`.
4. Variables `{{baseUrl}}` and `{{accessToken}}` are managed automatically. Running **Register** or **Login** auto-saves the token for all subsequent protected requests.

