import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "../../components/onboarding/WelcomeScreen";
import ProfileStep from "../../components/onboarding/ProfileStep";
import PrivacyStep from "../../components/onboarding/PrivacyStep";
import type { OnboardingData } from "../../types/onboarding";
import { apiRequest, logoutApi, setUser } from "../../lib/api";
import { useToast } from "../../hooks/useToast";

type Step = "welcome" | "profile" | "privacy";

const initialData: OnboardingData = {
  displayName: "",
  username: "",
  bio: "",
  photo: null,
  discoverable: true,
  allowMessageRequests: true,
  receiveSupportiveMessages: true,
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardingData>(initialData);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  function update(patch: Partial<OnboardingData>) {
    setData((previous) => ({ ...previous, ...patch }));
  }

  async function handleFinish() {
    setFinishing(true);
    setFinishError(null);
    try {
      const displayName = data.displayName.trim() || "Friend";
      const rawUsername = data.username.trim();
      const username =
        rawUsername.length >= 3
          ? rawUsername
          : displayName
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_")
              .replace(/^[^a-z]+/, "u")
              .slice(0, 20)
              .padEnd(3, "0");

      const res = await apiRequest<{ user: any }>("/api/v1/users/onboarding", {
        method: "POST",
        body: JSON.stringify({
          displayName,
          username,
          bio: data.bio?.trim() || undefined,
          discoverableProfile: data.discoverable,
          allowPrivateMessages: data.allowMessageRequests ? "allowed" : "requests_only",
        }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
      }
      showToast("Welcome to Comfort 💙");
      navigate("/home");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to complete onboarding.";
      setFinishError(msg);
      showToast(msg);
    } finally {
      setFinishing(false);
    }
  }

  if (step === "profile") {
    return (
      <ProfileStep
        data={data}
        onChange={update}
        onBack={() => setStep("welcome")}
        onContinue={() => setStep("privacy")}
        onSkip={() => setStep("privacy")}
      />
    );
  }

  if (step === "privacy") {
    return (
      <PrivacyStep
        data={data}
        onChange={update}
        onBack={() => setStep("profile")}
        onContinue={handleFinish}
        loading={finishing}
        error={finishError}
      />
    );
  }

  return (
    <div>
      <WelcomeScreen onStart={() => setStep("profile")} />
      <p className="mt-4 text-center text-[0.8125rem] text-navy/50">
        Wrong account?{" "}
        <button
          type="button"
          className="underline underline-offset-2 hover:text-navy transition"
          onClick={async () => {
            await logoutApi();
            navigate("/login");
          }}
        >
          Sign out and use a different account
        </button>
      </p>
    </div>
  );
}
