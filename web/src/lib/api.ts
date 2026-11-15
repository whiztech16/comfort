import { isPrivateDevice, removeLocalKey } from "./chatKeys";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// A 401 on these routes means "wrong credentials", not "session expired":
// show the error instead of trying to refresh and redirecting to /login
const NO_REFRESH = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/google",
  "/api/v1/auth/refresh",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

export interface UserState {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile?: {
    displayName: string | null;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  settings?: any;
}

let inMemoryToken: string | null = localStorage.getItem("comfort_access_token");

let inMemoryUser: UserState | null = (() => {
  try {
    const raw = localStorage.getItem("comfort_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem("comfort_access_token", token);
  } else {
    localStorage.removeItem("comfort_access_token");
  }
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export function setUser(user: UserState | null) {
  inMemoryUser = user;
  if (user) {
    localStorage.setItem("comfort_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("comfort_user");
  }
}

export function getUser(): UserState | null {
  return inMemoryUser;
}

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return false;
      const json = await res.json().catch(() => ({}));
      if (json.data?.accessToken) {
        setAccessToken(json.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

async function doFetch<T>(
  path: string,
  options: RequestInit
): Promise<{ success: boolean; message?: string; data?: T; code?: string; errors?: any[] }> {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (inMemoryToken) {
    headers.set("Authorization", `Bearer ${inMemoryToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      code: json.code || "UNKNOWN_ERROR",
      message: json.message || "An unexpected error occurred",
      errors: json.errors,
    };
  }

  return json;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message?: string; data?: T; code?: string; errors?: any[] }> {
  try {
    return await doFetch<T>(path, options);
  } catch (err: any) {
    if (
      err.status === 401 &&
      !NO_REFRESH.includes(path) &&
      (err.code === "TOKEN_EXPIRED" || err.code === "UNAUTHENTICATED")
    ) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        try {
          return await doFetch<T>(path, options);
        } catch (retryErr: any) {
          setAccessToken(null);
          setUser(null);
          throw retryErr;
        }
      }
      setAccessToken(null);
      setUser(null);
      window.location.href = "/login";
      throw err;
    }
    throw err;
  }
}

export async function fetchMe(): Promise<UserState | null> {
  if (!inMemoryToken) return null;
  try {
    const res = await apiRequest<{ user: UserState }>("/api/v1/auth/me");
    if (res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
  } catch {
    setAccessToken(null);
    setUser(null);
  }
  return null;
}

export async function googleSignInApi(idToken: string) {
  const res = await apiRequest<{ accessToken: string; user: UserState }>("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  if (res.data?.accessToken) {
    setAccessToken(res.data.accessToken);
  }
  if (res.data?.user) {
    setUser(res.data.user);
  }

  return res.data;
}

export async function loginApi(email: string, password: string) {
  const res = await apiRequest<{ accessToken: string; user: UserState }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res.data?.accessToken) {
    setAccessToken(res.data.accessToken);
  }
  if (res.data?.user) {
    setUser(res.data.user);
  }

  return res.data;
}

export async function registerApi(email: string, password: string) {
  const res = await apiRequest<{ accessToken: string; user: UserState }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res.data?.accessToken) {
    setAccessToken(res.data.accessToken);
  }
  if (res.data?.user) {
    setUser(res.data.user);
  }

  return res.data;
}

export async function logoutApi() {
  const currentUser = inMemoryUser;
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
    setUser(null);

    // If not a private device, clear local private chat key
    if (!isPrivateDevice() && currentUser?.id) {
      try {
        await removeLocalKey(currentUser.id);
      } catch (err) {
        console.warn("Failed to remove local chat key on logout:", err);
      }
    }

    // Clear session storage and any cached items
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
  }
}