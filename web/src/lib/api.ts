const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
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
    credentials: "include", // preserves refresh cookie
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // If token expired, clear memory
    if (res.status === 401 && (json.code === "TOKEN_EXPIRED" || json.code === "UNAUTHENTICATED")) {
      setAccessToken(null);
      setUser(null);
    }

    throw {
      status: res.status,
      code: json.code || "UNKNOWN_ERROR",
      message: json.message || "An unexpected error occurred",
      errors: json.errors,
    };
  }

  return json;
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
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
    setUser(null);
  }
}
