import { useEffect, useState, useMemo } from "react";
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

const fieldBase =
  "w-full rounded-2xl border bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2";
const okBorder = "border-transparent focus:ring-brand/40";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";

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

export default function UnlockChatsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"unlock" | "setup">("unlock");
  const [serverPublicKey, setServerPublicKey] = useState<string | null>(null);

  // Form fields
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkChatKeys() {
      const user = getUser();
      if (!user || !user.onboardingCompleted) return;

      const userId = user.id;

      // 1. Check if local key already exists in IndexedDB
      const localKey = await getLocalKey(userId);
      if (localKey) {
        // Already unlocked locally
        return;
      }

      // 2. Local key is missing, check server
      try {
        const accountKeyRes = await apiRequest<{ publicKey: string }>("/api/v1/keys/account");
        if (!active) return;
        const pubKey = accountKeyRes.data?.publicKey;

        if (pubKey) {
          setServerPublicKey(pubKey);
          setMode("unlock");
          setIsOpen(true);
        }
      } catch (err: unknown) {
        if (!active) return;
        const errObj = err as { status?: number };
        if (errObj.status === 404) {
          // No key was ever made for this user on the server.
          // Show setup mode directly in the modal to avoid infinite redirect loop with OnboardingGuard!
          setMode("setup");
          setIsOpen(true);
        }
      }
    }

    checkChatKeys();

    return () => {
      active = false;
    };
  }, []);

  const strengthResult = useMemo(() => {
    if (mode !== "setup" || !passphrase) return null;
    return zxcvbn(passphrase);
  }, [mode, passphrase]);

  const score = strengthResult ? strengthResult.score : 0;
  const isStrong = score >= 3;
  const passphrasesMatch =
    confirmPassphrase.length > 0 && passphrase === confirmPassphrase;

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!passphrase || !serverPublicKey) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Fetch encrypted backup from server
      const backupRes = await apiRequest<{
        encryptedPrivateKey: string;
        nonce: string;
        kdfSalt: string;
      }>("/api/v1/keys/backup");

      const backup = backupRes.data;
      if (!backup) {
        throw new Error("Unable to retrieve chat backup.");
      }

      // 2. Decrypt locally and verify derived public key against server public key
      const privateKey = await restoreFromBackup(backup, passphrase, serverPublicKey);

      if (!privateKey) {
        setError("Incorrect passphrase. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Store private key in IndexedDB
      const user = getUser();
      const userId = user?.id || "current_user";
      await storeLocalKey(userId, {
        publicKeyB64: serverPublicKey,
        privateKey,
      });

      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("comfort:chats_unlocked"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to decrypt chats.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    if (!isStrong) {
      setError("Please choose a stronger passphrase.");
      return;
    }
    if (!passphrasesMatch) {
      setError("Passphrases do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = getUser();
      const userId = user?.id || "current_user";

      // 1. Generate or reuse keypair
      let keypair = await getLocalKey(userId);
      if (!keypair) {
        const generated = await generateAccountKeys();
        keypair = {
          publicKeyB64: generated.publicKeyB64,
          privateKey: generated.privateKey,
        };
        await storeLocalKey(userId, keypair);
      }

      // 2. Create encrypted backup
      const backup = await createBackup(keypair.privateKey, passphrase);

      // 3. PUT /api/v1/keys/account
      await apiRequest("/api/v1/keys/account", {
        method: "PUT",
        body: JSON.stringify({ publicKey: keypair.publicKeyB64 }),
      });

      // 4. PUT /api/v1/keys/backup
      await apiRequest("/api/v1/keys/backup", {
        method: "PUT",
        body: JSON.stringify(backup),
      });

      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("comfort:chats_unlocked"));
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : err instanceof Error
          ? err.message
          : "Failed to protect chats.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  if (mode === "setup") {
    return (
      <Modal
        title="Protect your chats"
        description="Set up a passphrase to encrypt and safeguard your messages on Comfort."
        onClose={() => setIsOpen(false)}
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
                  <span className="font-medium text-navy/70">
                    Strength: {STRENGTH_LABELS[score]}
                  </span>
                  {!isStrong && (
                    <span className="text-[#b4443a]">Must be Strong or higher</span>
                  )}
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
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassphrase.length > 0 && !passphrasesMatch && (
              <p className="mt-1 text-[0.75rem] text-[#b4443a]">
                Passphrases do not match
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-[#fdf5e6] p-3 text-navy/80 border border-[#e8d5b5]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b58133]" />
            <p className="text-[0.75rem] leading-snug">
              <strong>Important:</strong> If you forget this passphrase and lose all your devices, your old chats can’t be recovered.
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
      onClose={() => setIsOpen(false)}
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
            onClick={() => setIsOpen(false)}
            className="text-[0.75rem] font-medium text-brand-deep underline underline-offset-2"
          >
            Forgot passphrase?
          </Link>
        </div>

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            disabled={loading || !passphrase}
            className="w-full gap-2"
          >
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
