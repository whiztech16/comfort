import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "../../components/onboarding/WelcomeScreen";
import ProfileStep from "../../components/onboarding/ProfileStep";
import PrivacyStep from "../../components/onboarding/PrivacyStep";
import type { OnboardingData } from "../../types/onboarding";
import { apiRequest, setUser } from "../../lib/api";
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
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  function update(patch: Partial<OnboardingData>) {
    setData((previous) => ({ ...previous, ...patch }));
  }

  async function finish() {
    try {
      const res = await apiRequest<{ user: any }>("/api/v1/users/onboarding", {
        method: "POST",
        body: JSON.stringify({
          displayName: data.displayName.trim() || "Friend",
          username: data.username.trim(),
          bio: data.bio?.trim() || undefined,
          discoverable: data.discoverable,
          allowMessageRequests: data.allowMessageRequests,
        }),
      });
      if (res.data?.user) {
        setUser(res.data.user);
      }
      showToast("Profile set up successfully 💙");
      navigate("/home");
    } catch (err: any) {
      showToast(err.message || "Failed to complete onboarding.");
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
        onFinish={finish}
      />
    );
  }

  return <WelcomeScreen onStart={() => setStep("profile")} />;
}