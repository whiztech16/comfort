import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "../../components/onboarding/WelcomeScreen";
import ProfileStep from "../../components/onboarding/ProfileStep";
import PrivacyStep from "../../components/onboarding/PrivacyStep";
import ProtectChatsStep from "../../components/onboarding/ProtectChatsStep";
import type { OnboardingData } from "../../types/onboarding";
import { apiRequest, getUser, setUser } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import {
  createBackup,
  generateAccountKeys,
  getLocalKey,
  storeLocalKey,
} from "../../lib/chatKeys";

type Step = "welcome" | "profile" | "privacy" | "protect-chats";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  function update(patch: Partial<OnboardingData>) {
    setData((previous) => ({ ...previous, ...patch }));
  }

  async function handleProtectChats(passphrase: string) {
    setFinishing(true);
    setFinishError(null);
    try {
      const user = getUser();
      const userId = user?.id || "current_user";

      // 1. Generate the keypair, or reuse the previously generated keypair from IndexedDB
      let keypair = await getLocalKey(userId);
      if (!keypair) {
        const generated = await generateAccountKeys();
        keypair = {
          publicKeyB64: generated.publicKeyB64,
          privateKey: generated.privateKey,
        };
        // 2. Save keypair to IndexedDB immediately
        await storeLocalKey(userId, keypair);
      }

      // 3. PUT /api/v1/keys/account with public key
      try {
        await apiRequest("/api/v1/keys/account", {
          method: "PUT",
          body: JSON.stringify({ publicKey: keypair.publicKeyB64 }),
        });
      } catch (keyErr: unknown) {
        const errObj = keyErr as { code?: string; message?: string };
        // If already registered with same key, proceed; otherwise throw
        if (errObj.code !== "KEY_ALREADY_REGISTERED") {
          throw keyErr;
        }
      }

      // 4. PUT /api/v1/keys/backup with passphrase-encrypted private key & salt
      const backup = await createBackup(keypair.privateKey, passphrase);
      await apiRequest("/api/v1/keys/backup", {
        method: "PUT",
        body: JSON.stringify(backup),
      });

      // 5. POST /api/v1/users/onboarding
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
      showToast("Profile set up and chats secured 💙");
      navigate("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to complete onboarding.";
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
        onContinue={() => setStep("protect-chats")}
      />
    );
  }

  if (step === "protect-chats") {
    return (
      <ProtectChatsStep
        onBack={() => setStep("privacy")}
        onSubmit={handleProtectChats}
        loading={finishing}
        error={finishError}
      />
    );
  }

  return <WelcomeScreen onStart={() => setStep("profile")} />;
}