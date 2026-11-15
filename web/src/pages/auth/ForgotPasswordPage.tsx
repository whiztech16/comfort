import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { PrimaryButton } from "../../components/shared/PrimaryButton";
import { requestPasswordResetApi } from "../../lib/passwordResetApi";

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const fieldClass =
  "w-full rounded-2xl border border-transparent bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2 focus:ring-brand/40";

function errorText(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  if (e.status === 429) return "Too many requests. Please try again later.";
  if (e.status === 422) return "Please enter a valid email address.";
  return e.message || "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setStatus("sending");
    try {
      await requestPasswordResetApi(value);
      setStatus("sent");
    } catch (err: unknown) {
      setStatus("idle");
      setError(errorText(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_14px_40px_rgba(27,53,102,0.1)] sm:p-8">
        {status === "sent" ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
              <MailCheck aria-hidden className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-navy">Check your email</h1>
            <p className="text-[0.9rem] leading-snug text-navy/60">
              If an account exists for <span className="font-medium text-navy">{email.trim()}</span>, we’ve sent a
              link to reset your password. It expires in 30 minutes.
            </p>
            <p className="text-[0.8125rem] text-navy/50">Nothing there? Check your spam folder.</p>
            <div className="flex flex-col items-center gap-2 pt-2">
              <Link
                to="/login"
                className="text-[0.875rem] font-medium text-brand-deep underline underline-offset-2"
              >
                Back to log in
              </Link>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="text-[0.8125rem] text-navy/60 underline underline-offset-2 hover:text-navy"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              Back
            </Link>

            <h1 className="mt-5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-[0.9rem] text-navy/60">
              Enter your email and we’ll send you a link to choose a new one.
            </p>

            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-2 block text-[0.8125rem] font-medium text-navy">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  aria-invalid={Boolean(error)}
                  className={fieldClass}
                />
              </div>

              {error ? (
                <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
                  {error}
                </p>
              ) : null}

              <PrimaryButton type="submit" disabled={!email.trim() || status === "sending"} className="w-full">
                {status === "sending" ? "Sending…" : "Send reset link"}
              </PrimaryButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}