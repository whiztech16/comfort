import { useState } from "react";
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
import { getMyProfile } from "../../lib/sampleProfiles";
import { logoutApi } from "../../lib/api";

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

// --- Delete-account confirmation modal ---------------------------------------
function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const profile = getMyProfile();
  const [email, setEmail] = useState("");
  const confirmed = email.trim().toLowerCase() === profile.email.toLowerCase();

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
            Enter the email address linked to your account to confirm you want to permanently delete it.
          </p>
        </div>

        <div>
          <label
            htmlFor="delete-email"
            className="mb-2 block text-[0.8125rem] font-medium text-navy"
          >
            Your email address
          </label>
          <input
            id="delete-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full rounded-full border border-transparent bg-[#f1f3fa] px-5 py-3 text-[0.9rem] text-navy outline-none transition focus:ring-2 focus:ring-[#b4443a]/30 placeholder:text-navy/40"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#b4443a] px-8 text-[0.9rem] font-semibold text-white transition hover:bg-[#9e3a31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4443a] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Delete my account
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

  const [showSignOut, setShowSignOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Notification toggles
  const [notifyComforts, setNotifyComforts] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyAppreciation, setNotifyAppreciation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
          checked={notifyComforts}
          onChange={setNotifyComforts}
        />
        <ToggleRow
          icon={MessageCircle}
          label="New private messages"
          sub="When a Comfort conversation starts"
          checked={notifyMessages}
          onChange={setNotifyMessages}
        />
        <ToggleRow
          icon={Bell}
          label="Appreciation responses"
          sub="When someone replies to your post with warmth"
          checked={notifyAppreciation}
          onChange={setNotifyAppreciation}
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
          onConfirm={async () => {
            await logoutApi();
            navigate("/login");
          }}
        />
      )}
    </div>
  );
}
