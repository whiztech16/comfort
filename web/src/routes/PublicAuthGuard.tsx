import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getUser } from "../lib/api";

export default function PublicAuthGuard() {
  const token = getAccessToken();
  const user = getUser();

  if (token && user?.onboardingCompleted) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
