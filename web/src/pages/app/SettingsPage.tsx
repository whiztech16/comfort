import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine,
  Lock,
  KeyRound,
  HelpCircle,
  LogOut,
  Trash2,
  Eye,
  MessageCircle,
  UserX,
  Bell,
  Sun,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Modal from "../../components/shared/Modal";
import { useToast } from "../../hooks/useToast";
import { apiRequest, getUser, logoutApi } from "../../lib/api";
import type { UserState } from "../../lib/api";

type NotifySettings = {
  notifyNewComforts: boolean;
  notifyNewMessages: boolean;
  notifyAppreciation: boolean;
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[0.75rem] font-semibold uppercase tracking-wider text-navy/40">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        {children}
      </div>
    </section>
  );
}

// ─── Clickable row ────────────────────────────────────────────────────────────
function Row({
  icon: Icon,
  label,
  sub,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-brand-deep [&:not(:last-child)]:border-b [&:not(:last-child)]:border-black/[0.05] ${
        danger ? "hover:bg-[#fff5f5]" : "hover:bg-[#f8f9fc]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          danger ? "bg-[#fff0f0] text-[#b4443a]" : "bg-[#eef1fa] text-brand-deep"
        }`}
      >
        <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span
          className={`block text-[0.9375rem] font-medium ${danger ? "text-[#b4443a]" : "text-navy"}`}
        >
          {label}
        </span>
        {sub && <span className="block text-[0.8125rem] text-navy/50">{sub}</span>}
      </span>
      <ChevronRight aria-hidden className="h-4 w-4 text-navy/30" strokeWidth={1.75} />
    </button>
  );
}

// ─── Info row (no click, no chevron) ─────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-black/[0.05]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
        <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-[0.9375rem] font-medium text-navy">{label}</span>
        {sub && <span className="block text-[0.8125rem] text-navy/50">{sub}</span>}
      </span>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({
  icon: Icon,
  label,
  sub,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-black/[0.05]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
        <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-[0.9375rem] font-medium text-navy">{label}</span>
        {sub && <span className="block text-[0.8125rem] text-navy/50">{sub}</span>}
      </span>
      {/* iOS-style toggle */}
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          checked ? "bg-brand-deep" : "bg-black/20"
        }`}
      >
        <span
          className={`absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}

// ─── Sign-out confirmation modal ──────────────────────────────────────────────
function SignOutModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      title="Sign out?"
      description="You'll need to log back in to access your account."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await onConfirm();
            } finally {
              setLoading(false);
            }
          }}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#527a9f] to-[#3f5f80] px-8 text-[0.9rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4a6b8c] disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Signing out..." : "Sign out"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// Turn a failed delete into a message the user can act on
function deleteErrorMessage(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (e?.status === 400) return "That password isn't right.";
  if (e?.status === 429) return "Too many attempts. Please wait a while and try again.";
  if (e?.status === 422) return "Enter your password to continue.";
  return e?.message || "We couldn't delete your account. Please try again.";
}

// --- Delete-account confirmation modal ---------------------------------------
function DeleteModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  // Accounts created with Google have no password to confirm with
  const user = getUser() as (UserState & { hasPassword?: boolean }) | null;
  const noPassword = user?.hasPassword === false;

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (err: unknown) {
      setError(deleteErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Delete your account?"
      description="This is permanent. All your posts, Comforts, and conversations will be gone forever."
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex gap-3 rounded-2xl bg-[#fff8f8] p-4">
          <AlertTriangle
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-[#b4443a]"
            strokeWidth={1.75}
          />
          <p className="text-[0.875rem] leading-snug text-navy/70">
            {noPassword
              ? "Your account uses Google sign-in and has no password yet. Use “Forgot password” on the login screen to set one, then come back here to delete your account."
              : "Enter your password to confirm you want to permanently delete your account."}
          </p>
        </div>

        {!noPassword ? (
          <div>
            <label
              htmlFor="delete-password"
              className="mb-2 block text-[0.8125rem] font-medium text-navy"
            >
              Your password
            </label>
            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              className="w-full rounded-full border border-transparent bg-[#f1f3fa] px-5 py-3 text-[0.9rem] text-navy outline-none transition focus:ring-2 focus:ring-[#b4443a]/30 placeholder:text-navy/40"
            />
            {error ? (
              <p role="alert" className="mt-2 px-1 text-[0.8125rem] text-[#b4443a]">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleDelete}
            disabled={noPassword || !password || loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#b4443a] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[#9e3a31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4443a] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {loading ? "Deleting..." : "Delete my account"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showSignOut, setShowSignOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Notification toggles live on the server
  const [notify, setNotify] = useState<NotifySettings>({
    notifyNewComforts: true,
    notifyNewMessages: true,
    notifyAppreciation: true,
  });
  // Dark mode is not built yet, so it stays local
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<{ settings: NotifySettings }>("/api/v1/settings")
      .then((res) => {
        const s = res.data?.settings;
        if (active && s) {
          setNotify({
            notifyNewComforts: s.notifyNewComforts,
            notifyNewMessages: s.notifyNewMessages,
            notifyAppreciation: s.notifyAppreciation,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Switch right away, then undo with a message if saving fails
  async function updateNotify(key: keyof NotifySettings, value: boolean) {
    const previous = notify[key];
    setNotify((s) => ({ ...s, [key]: value }));
    try {
      await apiRequest("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err: any) {
      setNotify((s) => ({ ...s, [key]: previous }));
      showToast(err?.message || "Couldn't save that setting.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-navy">
        Settings
      </h1>

      {/* ── Account ── */}
      <Section title="Account">
        <Row
          icon={PenLine}
          label="Edit profile"
          sub="Name, username, bio"
          onClick={() => navigate("/profile/edit")}
        />
        <Row
          icon={Lock}
          label="Change password"
          sub="Update your login password"
          onClick={() => navigate("/settings/change-password")}
        />
        <Row
          icon={KeyRound}
          label="Change chat passphrase"
          sub="Update your private chat encryption key"
          onClick={() => navigate("/settings/change-passphrase")}
        />
        <Row
          icon={HelpCircle}
          label="Forgot chat passphrase?"
          sub="Recovery details and how encryption works"
          onClick={() => navigate("/settings/forgot-passphrase")}
        />
        <Row
          icon={LogOut}
          label="Sign out"
          onClick={() => setShowSignOut(true)}
        />
        <Row
          icon={Trash2}
          label="Delete account"
          sub="Permanently remove your account and data"
          onClick={() => setShowDelete(true)}
          danger
        />
      </Section>

      {/* ── Privacy & Safety ── */}
      <Section title="Privacy & Safety">
        <InfoRow
          icon={Eye}
          label="Anonymous posting"
          sub="Your name is never shown on anonymous posts"
        />
        <Row
          icon={MessageCircle}
          label="Messaging preferences"
          sub="Who can send you Comforts"
          onClick={() => navigate("/settings/messaging-preferences")}
        />
        <Row
          icon={UserX}
          label="Blocked users"
          sub="Manage who you've blocked"
          onClick={() => navigate("/settings/blocked-users")}
        />
      </Section>

      {/* ── Preferences ── */}
      <Section title="Preferences">
        <ToggleRow
          icon={Bell}
          label="New Comforts received"
          sub="When someone sends you a Comfort"
          checked={notify.notifyNewComforts}
          onChange={(v) => updateNotify("notifyNewComforts", v)}
        />
        <ToggleRow
          icon={MessageCircle}
          label="New private messages"
          sub="When you get a private message"
          checked={notify.notifyNewMessages}
          onChange={(v) => updateNotify("notifyNewMessages", v)}
        />
        <ToggleRow
          icon={Bell}
          label="Appreciation responses"
          sub="When someone replies to your post with warmth"
          checked={notify.notifyAppreciation}
          onChange={(v) => updateNotify("notifyAppreciation", v)}
        />
        <ToggleRow
          icon={Sun}
          label="Dark mode"
          sub="Coming soon"
          checked={darkMode}
          onChange={setDarkMode}
        />
      </Section>

      {/* ── Modals ── */}
      {showSignOut && (
        <SignOutModal
          onClose={() => setShowSignOut(false)}
          onConfirm={async () => {
            await logoutApi();
            navigate("/login");
          }}
        />
      )}
      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={async (password) => {
            // A wrong password throws here, so the modal shows it and nothing is logged out
            await apiRequest("/api/v1/users/me", {
              method: "DELETE",
              body: JSON.stringify({ password }),
            });
            // The account is already gone; a failed sign-out call must not block leaving
            await logoutApi().catch(() => {});
            navigate("/login");
          }}
        />
      )}
    </div>
  );
}