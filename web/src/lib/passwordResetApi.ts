import { apiRequest } from "./api";

export async function requestPasswordResetApi(email: string): Promise<void> {
  await apiRequest("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(token: string, password: string): Promise<void> {
  await apiRequest("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}