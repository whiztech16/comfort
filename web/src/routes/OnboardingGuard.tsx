import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getUser, fetchMe } from "../lib/api";

export default function OnboardingGuard() {
  const token = getAccessToken();
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(!user && Boolean(token));

  useEffect(() => {
    if (token && !user) {
      fetchMe()
        .then((fresh) => setUserState(fresh))
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafd]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#243447] border-t-transparent" />
      </div>
    );
  }

  if (user?.onboardingCompleted) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

