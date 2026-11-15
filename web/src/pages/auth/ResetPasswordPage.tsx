import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, LinkIcon } from "lucide-react";
import { PrimaryButton, PrimaryLink } from "../../components/shared/PrimaryButton";
import { setAccessToken, setUser } from "../../lib/api";
import { resetPasswordApi } from "../../lib/passwordResetApi";

const fieldClass =
  "w-full rounded-2xl border bg-[#f1f3fa] px-4 py-3 pr-11 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2";

// The email link looks like /reset-password#token=...
function readToken(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  const token = new URLSearchParams(hash).get("token");
  return token && /^[\w-]{20,128}$/.test(token) ? token : null;
}

function errorText(err: unknown): { text: string; expired: boolean } {
  const e = err as {
    status?: number;
    code?: string;
    message?: string;
    errors?: { message?: string }[];
  } | null;
  if (!e?.status) return { text: "Check your connection and try again.", expired: false };
  if (e.code === "INVALID_RESET_TOKEN") {
    return { text: "This reset link is invalid or has expired.", expired: true };
  }
  if (e.status === 429) return { text: "Too many requests. Please try again later.", expired: false };
  if (e.status === 422) {
    return { text: e.errors?.[0]?.message || "Please choose a stronger password.", expired: false };
  }
  return { text: e.message || "Something went wrong. Please try again.", expired: false };
}

export default function ResetPasswordPage() {
  const [token] = useState<string | null>(readToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // Take the token out of the address bar so it isn't left in history
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const matches = confirm.length > 0 && password === confirm;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving) return;
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (!matches) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await resetPasswordApi(token, password);
      // The server signed this account out everywhere, so clear this browser too
      setAccessToken(null);
      setUser(null);
      setDone(true);
    } catch (err: unknown) {
      const result = errorText(err);
      setError(result.text);
      setExpired(result.expired);
    } finally {
      setSaving(false);
    }
  }

  let content;
  if (done) {
    content = (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
          <CheckCircle2 aria-hidden className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-navy">Password updated</h1>
        <p className="text-[0.9rem] leading-snug text-navy/60">
          For your security, you’ve been signed out on all devices. Log in with your new password.
        </p>
        <div className="flex justify-center pt-2">
          <PrimaryLink to="/login">Log in</PrimaryLink>
        </div>
      </div>
    );
  } else if (!token || expired) {
    content = (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
          <LinkIcon aria-hidden className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-navy">
          This link isn’t valid
        </h1>
        <p className="text-[0.9rem] leading-snug text-navy/60">
          The reset link is missing, already used, or has expired. Request a new one and we’ll email it to you.
        </p>
        <div className="flex flex-col items-center gap-2 pt-2">
          <PrimaryLink to="/forgot-password">Get a new link</PrimaryLink>
          <Link to="/login" className="text-[0.8125rem] text-navy/60 underline underline-offset-2 hover:text-navy">
            Back to log in
          </Link>
        </div>
      </div>
    );
  } else {
    content = (
      <>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">Pick one you don’t use anywhere else.</p>

        <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-[0.8125rem] font-medium text-navy">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a new password"
                className={`${fieldClass} border-transparent focus:ring-brand/40`}
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="mb-2 block text-[0.8125rem] font-medium text-navy">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              className={`${fieldClass} ${
                confirm && !matches
                  ? "border-[#b4443a] focus:ring-[#b4443a]/20"
                  : "border-transparent focus:ring-brand/40"
              }`}
            />
            {confirm && !matches ? (
              <p className="mt-1 text-[0.75rem] text-[#b4443a]">Passwords do not match</p>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
              {error}
            </p>
          ) : null}

          <PrimaryButton type="submit" disabled={!password || !matches || saving} className="w-full">
            {saving ? "Saving…" : "Update password"}
          </PrimaryButton>
        </form>
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_14px_40px_rgba(27,53,102,0.1)] sm:p-8">
        {content}
      </div>
    </div>
  );
}