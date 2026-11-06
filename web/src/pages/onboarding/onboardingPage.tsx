import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "../../components/onboarding/WelcomeScreen";
import ProfileStep from "../../components/onboarding/ProfileStep";
import PrivacyStep from "../../components/onboarding/PrivacyStep";
import type { OnboardingData } from "../../types/onboarding";

type Step = "welcome" | "profile" | "privacy";

const initialData: OnboardingData = {
  displayName: "",
  username: "",
  bio: "",
  photo: null,
  discoverable: false,
  allowMessageRequests: false,
  receiveSupportiveMessages: true,
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardingData>(initialData);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  function update(patch: Partial<OnboardingData>) {
    setData((previous) => ({ ...previous, ...patch }));
  }

  function finish() {
    // Later: send `data` to the backend so it is saved and enforced there
    navigate("/home");
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