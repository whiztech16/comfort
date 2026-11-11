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
import ChangePasswordPage from "../pages/app/ChangePasswordPage";
import ChangePassphrasePage from "../pages/app/ChangePassphrasePage";
import ForgotPassphrasePage from "../pages/app/ForgotPassphrasePage";
import MessagingPreferencesPage from "../pages/app/MessagingPreferencesPage";
import BlockedUsersPage from "../pages/app/BlockedUsersPage";
import AuthGuard from "./AuthGuard";
import OnboardingGuard from "./OnboardingGuard";
import PublicAuthGuard from "./PublicAuthGuard";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest only: redirects to /home or /onboarding if already signed in */}
      <Route element={<PublicAuthGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Onboarding only: requires signed-in user who hasn't finished onboarding */}
      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Logged-in application: requires signed-in user with onboardingCompleted=true */}
      <Route element={<AuthGuard />}>
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
          <Route path="/settings/change-password" element={<ChangePasswordPage />} />
          <Route path="/settings/change-passphrase" element={<ChangePassphrasePage />} />
          <Route path="/settings/forgot-passphrase" element={<ForgotPassphrasePage />} />
          <Route
            path="/settings/messaging-preferences"
            element={<MessagingPreferencesPage />}
          />
          <Route path="/settings/blocked-users" element={<BlockedUsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
