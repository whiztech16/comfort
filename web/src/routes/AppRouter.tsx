import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/landing/landingpage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import OnboardingPage from "../pages/onboarding/onboardingPage";
import DoveDemoPage from "../pages/public/DovePage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dove-demo" element={<DoveDemoPage />} />
    </Routes>
  );
}
