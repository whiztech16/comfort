import { z } from "zod";

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10, "At least 10 characters").max(128, "At most 128 characters");

export const registerSchema = z.object({ email, password }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const googleSchema = z.object({ idToken: z.string().min(20).max(4096) }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ token: z.string().regex(TOKEN_PATTERN), password }).strict();
export const sessionParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, { message: "Must be different", path: ["newPassword"] });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;