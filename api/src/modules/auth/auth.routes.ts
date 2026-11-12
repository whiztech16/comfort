import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import {
  forgotLimiter,
  googleLimiter,
  loginIpLimiter,
  loginLimiter,
  refreshLimiter,
  registerLimiter,
  resetLimiter,
  sensitiveLimiter,
} from "../../shared/http/rate-limit";
import {
  changePassword,
  forgotPassword,
  googleSignIn,
  listSessions,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  revokeSession,
} from "./auth.controllers";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, register);
authRouter.post("/login", loginIpLimiter, loginLimiter, login);
authRouter.post("/google", googleLimiter, googleSignIn);
authRouter.post("/refresh", refreshLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);
authRouter.get("/sessions", authenticate, listSessions);
authRouter.delete("/sessions/:id", authenticate, revokeSession);
authRouter.post("/change-password", authenticate, sensitiveLimiter, changePassword);
authRouter.post("/forgot-password", forgotLimiter, forgotPassword);
authRouter.post("/reset-password", resetLimiter, resetPassword);