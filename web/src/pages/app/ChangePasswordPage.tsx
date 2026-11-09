import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { PrimaryButton } from "../../components/shared/PrimaryButton";
import { useToast } from "../../hooks/useToast";
import { apiRequest, setAccessToken } from "../../lib/api";

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-navy";
const fieldBase =
  "w-full rounded-2xl border bg-[#f1f3fa] text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2";
const okBorder = "border-transparent focus:ring-brand/40";
const badBorder = "border-[#b4443a] focus:ring-[#b4443a]/20";
const errorClass = "mt-2 px-1 text-[0.8125rem] text-[#b4443a]";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors: {
    current?: string;
    newPass?: string;
    confirm?: string;
  } = {};

  if (!currentPassword) {
    errors.current = "Please enter your current password.";
  }
  if (newPassword.length < 10) {
    errors.newPass = "New password must be at least 10 characters.";
  } else if (newPassword === currentPassword) {
    errors.newPass = "New password must be different from current password.";
  }
  if (confirmPassword !== newPassword) {
    errors.confirm = "Passwords do not match.";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (errors.current || errors.newPass || errors.confirm) return;

    try {
      setLoading(true);
      const res = await apiRequest<{ accessToken: string }>("/api/v1/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
      }

      showToast("Password updated successfully.");
      navigate("/settings");
    } catch (err: any) {
      setServerError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back to Settings
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Change password
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Choose a strong, unique password to keep your space safe.
        </p>
      </section>

      {serverError && (
        <div className="rounded-2xl border border-[#ffccc7] bg-[#fff1f0] p-4 text-[0.85rem] text-[#b4443a]">
          {serverError}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div>
          <label htmlFor="current-password" className={labelClass}>
            Current password
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              className={`${fieldBase} h-12 pl-4 pr-11 ${
                submitted && errors.current ? badBorder : okBorder
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/50 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
            >
              {showCurrent ? (
                <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {submitted && errors.current ? (
            <p className={errorClass}>{errors.current}</p>
          ) : null}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="new-password" className={labelClass}>
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className={`${fieldBase} h-12 pl-4 pr-11 ${
                submitted && errors.newPass ? badBorder : okBorder
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/50 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
            >
              {showNew ? (
                <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {submitted && errors.newPass ? (
            <p className={errorClass}>{errors.newPass}</p>
          ) : null}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className={`${fieldBase} h-12 pl-4 pr-11 ${
                submitted && errors.confirm ? badBorder : okBorder
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/50 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
            >
              {showConfirm ? (
                <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {submitted && errors.confirm ? (
            <p className={errorClass}>{errors.confirm}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row-reverse">
          <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Updating..." : "Update password"}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

