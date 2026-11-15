


import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, ShieldAlert } from "lucide-react";
import zxcvbn from "zxcvbn";
import Modal from "../shared/Modal";
import { PrimaryButton } from "../shared/PrimaryButton";
import { apiRequest, getUser } from "../../lib/api";
import {
  createBackup,
  generateAccountKeys,
  getLocalKey,
  restoreFromBackup,
  storeLocalKey,
} from "../../lib/chatKeys";
import type { StoredKeypair } from "../../lib/chatKeys";

const fieldBase =
  "w-full rounded-2xl border bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2";
const okBorder = "border-transparent focus:ring-brand/40";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = [
  "bg-[#b4443a]",
  "bg-[#e07a38]",
  "bg-[#e0b038]",
  "bg-[#4a8a5b]",
  "bg-[#2d7a46]",
];

type Props = Readonly<{
  mode: "setup" | "unlock";
  serverPublicKey: string | null;
  onDone: () => void;
  onDismiss: () => void;
}>;

function messageOf(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}

export default function UnlockChatsModal({ mode, serverPublicKey, onDone, onDismiss }: Props) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strengthResult = useMemo(() => {
    if (mode !== "setup" || !passphrase) return null;
    return zxcvbn(passphrase);
  }, [mode, passphrase]);

  const score = strengthResult ? strengthResult.score : 0;
  const isStrong = score >= 3;
  const passphrasesMatch = confirmPassphrase.length > 0 && passphrase === confirmPassphrase;

  function finish() {
    window.dispatchEvent(new CustomEvent("comfort:chats_unlocked"));
    onDone();
  }

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!passphrase || !serverPublicKey || loading) return;

    const userId = getUser()?.id;
    if (!userId) {
      setError("Please log in again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const backupRes = await apiRequest<{
        encryptedPrivateKey: string;
        nonce: string;
        kdfSalt: string;
      }>("/api/v1/keys/backup");

      const backup = backupRes.data;
      if (!backup) throw new Error("Unable to retrieve chat backup.");

      const privateKey = await restoreFromBackup(backup, passphrase, serverPublicKey);
      if (!privateKey) {
        setError("Incorrect passphrase. Please try again.");
        return;
      }

      await storeLocalKey(userId, { publicKeyB64: serverPublicKey, privateKey });
      finish();
    } catch (err: unknown) {
      setError(messageOf(err, "Failed to unlock chats."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!isStrong) {
      setError("Please choose a stronger passphrase.");
      return;
    }
    if (!passphrasesMatch) {
      setError("Passphrases do not match.");
      return;
    }

    const userId = getUser()?.id;
    if (!userId) {
      setError("Please log in again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const existing = await getLocalKey(userId);
      let keypair: StoredKeypair;
      if (existing) {
        keypair = existing;
      } else {
        const generated = await generateAccountKeys();
        keypair = { publicKeyB64: generated.publicKeyB64, privateKey: generated.privateKey };
      }

      const backup = await createBackup(keypair.privateKey, passphrase);

      await apiRequest("/api/v1/keys/account", {
        method: "PUT",
        body: JSON.stringify({ publicKey: keypair.publicKeyB64 }),
      });
      await apiRequest("/api/v1/keys/backup", {
        method: "PUT",
        body: JSON.stringify(backup),
      });

      // Keep the key on this device only once the server has both uploads
      if (!existing) await storeLocalKey(userId, keypair);
      finish();
    } catch (err: unknown) {
      setError(messageOf(err, "Failed to protect chats."));
    } finally {
      setLoading(false);
    }
  }

  if (mode === "setup") {
    return (
      <Modal
        title="Protect your chats"
        description="Set up a passphrase to encrypt and safeguard your messages on Comfort."
        onClose={onDismiss}
      >
        <form onSubmit={handleSetup} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-[#ffccc7] bg-[#fff1f0] p-3 text-[0.8125rem] text-[#b4443a]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="setup-passphrase" className="mb-2 block text-[0.8125rem] font-medium text-navy">
              Create a chat passphrase
            </label>
            <div className="relative">
              <input
                id="setup-passphrase"
                type={showPassphrase ? "text" : "password"}
                autoComplete="new-password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                required
                placeholder="Choose a strong passphrase"
                className={`${fieldBase} pr-11 ${error ? badBorder : okBorder}`}
              />
              <button
                type="button"
                aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                onClick={() => setShowPassphrase((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
              >
                {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {passphrase.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-black/10">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 transition-all duration-300 ${
                        i <= score ? STRENGTH_COLORS[score] : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[0.75rem]">
                  <span className="font-medium text-navy/70">Strength: {STRENGTH_LABELS[score]}</span>
                  {!isStrong && <span className="text-[#b4443a]">Must be Strong or higher</span>}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-passphrase" className="mb-2 block text-[0.8125rem] font-medium text-navy">
              Confirm your passphrase
            </label>
            <div className="relative">
              <input
                id="confirm-passphrase"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                required
                placeholder="Re-enter your passphrase"
                className={`${fieldBase} pr-11 ${
                  confirmPassphrase && !passphrasesMatch ? badBorder : okBorder
                }`}
              />
              <button
                type="button"
                aria-label={showConfirm ? "Hide passphrase" : "Show passphrase"}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassphrase.length > 0 && !passphrasesMatch && (
              <p className="mt-1 text-[0.75rem] text-[#b4443a]">Passphrases do not match</p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[#e8d5b5] bg-[#fdf5e6] p-3 text-navy/80">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b58133]" />
            <p className="text-[0.75rem] leading-snug">
              <strong>Important:</strong> If you forget this passphrase and lose all your devices, your old chats
              can’t be recovered.
            </p>
          </div>

          <div className="pt-2">
            <PrimaryButton
              type="submit"
              disabled={loading || !isStrong || !passphrasesMatch}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Protecting chats…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Save & Protect chats
                </>
              )}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      title="Unlock your chats"
      description="Enter your chat passphrase to access and read your conversations on this device."
      onClose={onDismiss}
    >
      <form onSubmit={handleUnlock} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-[#ffccc7] bg-[#fff1f0] p-3 text-[0.8125rem] text-[#b4443a]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="unlock-passphrase" className="mb-2 block text-[0.8125rem] font-medium text-navy">
            Chat passphrase
          </label>
          <div className="relative">
            <input
              id="unlock-passphrase"
              type={showPassphrase ? "text" : "password"}
              autoComplete="current-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              required
              placeholder="Enter your chat passphrase"
              className={`${fieldBase} pr-11 ${error ? badBorder : okBorder}`}
            />
            <button
              type="button"
              aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
              onClick={() => setShowPassphrase((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            to="/settings/forgot-passphrase"
            onClick={onDismiss}
            className="text-[0.75rem] font-medium text-brand-deep underline underline-offset-2"
          >
            Forgot passphrase?
          </Link>
        </div>

        <div className="pt-2">
          <PrimaryButton type="submit" disabled={loading || !passphrase} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlocking chats…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Unlock chats
              </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}