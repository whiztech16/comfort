import { useState, useMemo, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import zxcvbn from "zxcvbn";
import { apiRequest, getUser } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import {
  createBackup,
  getLocalKey,
  restoreFromBackup,
  type StoredKeypair,
} from "../../lib/chatKeys";
import { PrimaryButton } from "../../components/shared/PrimaryButton";

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-navy";
const fieldBase =
  "w-full rounded-2xl border bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2 border-transparent focus:ring-brand/40";

const STRENGTH_LABELS = [
  "Very weak",
  "Weak",
  "Fair",
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

export default function ChangePassphrasePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [localKey, setLocalKey] = useState<StoredKeypair | null>(null);
  const [checkingLocalKey, setCheckingLocalKey] = useState(true);

  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if chats are currently unlocked on this device
  useEffect(() => {
    const user = getUser();
    const userId = user?.id || "current_user";
    getLocalKey(userId)
      .then((key) => {
        setLocalKey(key);
      })
      .finally(() => {
        setCheckingLocalKey(false);
      });
  }, []);

  const strengthResult = useMemo(() => {
    if (!newPassphrase) return null;
    return zxcvbn(newPassphrase);
  }, [newPassphrase]);

  const score = strengthResult ? strengthResult.score : 0;
  const isStrong = score >= 3;
  const match = newPassphrase.length > 0 && newPassphrase === confirmNewPassphrase;
  const different = currentPassphrase !== newPassphrase;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!localKey) {
      setError("Your chats are not unlocked on this device. Please unlock your chats first.");
      return;
    }

    if (!isStrong) {
      setError("Please choose a stronger new passphrase.");
      return;
    }

    if (!match) {
      setError("New passphrases do not match.");
      return;
    }

    if (!different) {
      setError("New passphrase must be different from current passphrase.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current passphrase against active server backup
      const backupRes = await apiRequest<{
        backup: { encryptedPrivateKey: string; nonce: string; kdfSalt: string };
      }>("/api/v1/keys/backup");

      const backup = backupRes.data?.backup;
      if (!backup) {
        throw new Error("No existing backup found.");
      }

      const verifiedKey = await restoreFromBackup(backup, currentPassphrase, localKey.publicKeyB64);
      if (!verifiedKey) {
        setError("Current passphrase is incorrect.");
        setLoading(false);
        return;
      }

      // 2. Re-encrypt the existing private key with the new passphrase & fresh salt/nonce
      const newBackup = await createBackup(localKey.privateKey, newPassphrase);

      // 3. Upload new backup to server
      await apiRequest("/api/v1/keys/backup", {
        method: "PUT",
        body: JSON.stringify(newBackup),
      });

      showToast("Chat passphrase updated successfully 💙");
      navigate("/settings");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update chat passphrase.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (checkingLocalKey) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-deep" />
      </div>
    );
  }

  if (!localKey) {
    return (
      <div className="space-y-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Back to Settings
        </Link>

        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-[1.125rem] font-semibold text-amber-950">
                Unlock chats required
              </h2>
              <p className="text-[0.875rem] leading-relaxed text-amber-900/80">
                To change your chat passphrase, your chats must be unlocked on this device.
              </p>
              <div className="pt-2">
                <Link
                  to="/comforts"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-amber-900 px-5 text-[0.8125rem] font-medium text-white transition hover:bg-amber-950"
                >
                  Go to chats to unlock
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back to Settings
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Change chat passphrase
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Re-encrypt your private key backup with a new passphrase. Your existing messages stay safe.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-[#ffccc7] bg-[#fff1f0] p-4 text-[0.8125rem] text-[#b4443a]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
        {/* Current Passphrase */}
        <div>
          <label htmlFor="current-passphrase" className={labelClass}>
            Current chat passphrase
          </label>
          <div className="relative">
            <input
              id="current-passphrase"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              required
              placeholder="Enter your current passphrase"
              className={`${fieldBase} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Passphrase */}
        <div>
          <label htmlFor="new-passphrase" className={labelClass}>
            New chat passphrase
          </label>
          <div className="relative">
            <input
              id="new-passphrase"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              required
              placeholder="Choose a strong new passphrase"
              className={`${fieldBase} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {newPassphrase && (
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
                <span className={isStrong ? "font-medium text-[#2d7a46]" : "text-navy/60"}>
                  Strength: {STRENGTH_LABELS[score]}
                </span>
                {strengthResult?.feedback.warning && (
                  <span className="text-[#b4443a]">{strengthResult.feedback.warning}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirm New Passphrase */}
        <div>
          <label htmlFor="confirm-new-passphrase" className={labelClass}>
            Confirm new passphrase
          </label>
          <div className="relative">
            <input
              id="confirm-new-passphrase"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmNewPassphrase}
              onChange={(e) => setConfirmNewPassphrase(e.target.value)}
              required
              placeholder="Re-enter your new passphrase"
              className={`${fieldBase} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmNewPassphrase && !match && (
            <p className="mt-1.5 text-[0.75rem] text-[#b4443a]">
              Passphrases do not match.
            </p>
          )}
        </div>

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            disabled={loading || !isStrong || !match || !currentPassphrase}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating passphrase…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Update passphrase
              </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
