import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getUser } from "../lib/api";

/**
 * Prevents logged-in users from seeing /login or /signup again.
 * Redirects them to /home if onboarded, or /onboarding if not.
 */
export default function PublicAuthGuard() {
  const token = getAccessToken();
  const user = getUser();

  if (token) {
    if (!user?.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

