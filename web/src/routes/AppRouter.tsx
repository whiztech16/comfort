import { Routes, Route } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LandingPage from "../pages/landing/landingpage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import OnboardingPage from "../pages/onboarding/onboardingPage";
import HomePage from "../pages/app/Homepage";
import ComfortsPage from "../pages/app/ComfortsPage";
import ConversationPage from "../pages/app/ConversationPage";
import SendComfortPage from "../pages/app/SendComfortPage";
import ProfilePage from "../pages/app/ProfilePage";
import EditProfilePage from "../pages/app/EditProfilePage";
import UserProfilePage from "../pages/app/UserProfilePage";
import SettingsPage from "../pages/app/SettingsPage";
import CreatePostPage from "../pages/app/CreatePostPage";
import ComfortDetailPage from "../pages/app/ComfortDetailPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Logged-in app: shares the header, sidebar and bottom nav */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/posts/new" element={<CreatePostPage />} />

        <Route path="/send-comfort/:postId" element={<SendComfortPage />} />
        <Route path="/send-comfort/to/:username" element={<SendComfortPage />} />

        <Route path="/comforts" element={<ComfortsPage />} />
        <Route
          path="/comforts/conversations/:conversationId"
          element={<ConversationPage />}
        />
        <Route path="/comforts/:messageId" element={<ComfortDetailPage />} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/u/:username" element={<UserProfilePage />} />

        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
