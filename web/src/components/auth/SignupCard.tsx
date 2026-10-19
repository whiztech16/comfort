import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "./Googleicon";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-black bg-white px-3.5 text-[0.875rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-black focus:ring-2 focus:ring-black/15";

const labelClass = "block text-[0.875rem] font-medium text-charcoal";

const linkClass = "font-semibold text-charcoal underline underline-offset-2";

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_16px_50px_rgba(38,55,70,0.14)] sm:p-7">
      <h1 className="text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-charcoal sm:text-[1.625rem]">
        Create account
      </h1>
      <p className="mt-1 text-[0.85rem] text-charcoal/55">
        Share when you’re ready. Receive kindness without pressure.
      </p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Name */}
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="nickname"
            placeholder="e.g. Alex Rivera"
            required
            maxLength={40}
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. alex@example.com"
            required
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="e.g. min. 8 characters"
              required
              minLength={8}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-[calc(50%+3px)] -translate-y-1/2 text-charcoal/55 transition hover:text-charcoal focus-visible:outline-2 focus-visible:outline-calm"
            >
              {showPassword ? (
                <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Terms and Privacy */}
        <label className="flex items-start gap-2.5 pt-0.5 text-[0.725rem] leading-snug text-charcoal/70">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-black accent-[#4a6b8c]"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className={linkClass}>
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-lg bg-[#4a6b8c] text-[0.875rem] font-medium text-white transition hover:bg-[#3f5f80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
        >
          Create account
        </button>
      </form>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3 text-[0.7rem] text-charcoal/45">
        <span className="h-px flex-1 bg-softgrey" />
        or
        <span className="h-px flex-1 bg-softgrey" />
      </div>

      {/* Google */}
      <button
        type="button"
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-black bg-white text-[0.8125rem] font-medium text-charcoal transition hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-4 text-center text-[0.75rem] text-charcoal/55">
        Already have an account?{" "}
        <Link to="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </div>
  );
}