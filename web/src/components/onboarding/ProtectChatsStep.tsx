import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, ShieldAlert, Loader2 } from "lucide-react";
import zxcvbn from "zxcvbn";
import OnboardingShell from "./OnboardingShell";
import { PrimaryButton } from "../shared/PrimaryButton";

type ProtectChatsStepProps = Readonly<{
  onBack: () => void;
  onSubmit: (passphrase: string) => Promise<void>;
  loading: boolean;
  error?: string | null;
}>;

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-charcoal";
const fieldBase =
  "w-full rounded-2xl border bg-white px-4 py-3 text-[0.9rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:ring-2";
const okBorder = "border-softgrey focus:border-calm focus:ring-calm/20";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

const STRENGTH_LABELS = [
  "Very weak",
  "Weak",
  "Fair (needs more variety)",
  "Strong",
  "Very strong",
];

const STRENGTH_COLORS = [
  "bg-[#b4443a]",
  "bg-[#e07a38]",
  "bg-[#e0b038]",
  "bg-[#4a8a5b]",
  "bg-[#2d7a46]",
];

export default function ProtectChatsStep({
  onBack,
  onSubmit,
  loading,
  error,
}: ProtectChatsStepProps) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);

  const strengthResult = useMemo(() => {
    if (!passphrase) return null;
    return zxcvbn(passphrase);
  }, [passphrase]);

  const score = strengthResult ? strengthResult.score : 0;
  const isStrong = score >= 3;
  const passwordsMatch = passphrase.length > 0 && passphrase === confirmPassphrase;
  const canSubmit = isStrong && passwordsMatch && !loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit(passphrase);
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={3}
      title="Protect your private chats"
      subtitle="Your supportive conversations are end-to-end encrypted. Create a passphrase to secure them."
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
        <div className="space-y-4">
          {/* Passphrase field */}
          <div>
            <label htmlFor="chat-passphrase" className={labelClass}>
              Choose a chat passphrase
            </label>
            <div className="relative">
              <input
                id="chat-passphrase"
                type={showPassphrase ? "text" : "password"}
                autoComplete="new-password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="A memorable phrase or sentence"
                className={`${fieldBase} pr-11 ${
                  touched && !isStrong ? badBorder : okBorder
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassphrase((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
              >
                {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength meter */}
            {passphrase && (
              <div className="mt-2.5">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        score > index ? STRENGTH_COLORS[score] : "bg-black/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[0.75rem]">
                  <span
                    className={
                      isStrong
                        ? "font-medium text-[#2d7a46]"
                        : "text-charcoal/60"
                    }
                  >
                    Strength: {STRENGTH_LABELS[score]}
                  </span>
                  {strengthResult?.feedback.warning ? (
                    <span className="text-[#b4443a]">
                      {strengthResult.feedback.warning}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Confirm passphrase field */}
          <div>
            <label htmlFor="confirm-passphrase" className={labelClass}>
              Confirm passphrase
            </label>
            <div className="relative">
              <input
                id="confirm-passphrase"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter your passphrase"
                className={`${fieldBase} pr-11 ${
                  touched && !passwordsMatch ? badBorder : okBorder
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                aria-label={showConfirm ? "Hide confirm passphrase" : "Show confirm passphrase"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassphrase && !passwordsMatch ? (
              <p className="mt-1.5 text-[0.75rem] text-[#b4443a]">
                Passphrases do not match.
              </p>
            ) : null}
          </div>
        </div>

        {/* Warning Card */}
        <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-[0.8125rem] text-amber-950">
          <div className="flex gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div className="leading-snug space-y-1">
              <p className="font-semibold text-amber-900">
                Keep this passphrase safe
              </p>
              <p className="text-amber-800/90">
                If you forget this passphrase and lose all your devices, your old chats can’t be recovered.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-[0.8125rem] text-[#b4443a]">
            {error}
          </p>
        ) : null}

        <div className="mt-auto pt-8">
          <PrimaryButton
            type="submit"
            disabled={!canSubmit}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Encrypting & securing chats…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Complete setup
              </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </OnboardingShell>
  );
}
