import { Routes, Route } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LandingPage from "../pages/landing/landingpage";
import DoveDemoPage from "../pages/public/DovePage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import OnboardingPage from "../pages/onboarding/onboardingPage";
import HomePage from "../pages/app/Homepage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dove-demo" element={<DoveDemoPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Logged-in app: shares the header, sidebar and bottom nav */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
