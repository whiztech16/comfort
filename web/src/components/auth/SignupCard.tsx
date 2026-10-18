import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "./Googleicon";

const inputClass =
  "h-12 w-full rounded-full border border-softgrey bg-white pl-11 pr-11 text-[0.875rem] text-charcoal outline-none transition placeholder:text-charcoal/45 focus:border-calm focus:ring-2 focus:ring-calm/20";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-charcoal/55";

const linkClass =
  "font-semibold text-charcoal underline underline-offset-2";

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(38,55,70,0.18)] md:p-8">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-charcoal">
        Join Comfort
      </h1>
      <p className="mt-1.5 text-[0.9rem] text-charcoal/50">
        Share when you’re ready. Receive kindness without pressure.
      </p>

      <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
        {/* Display name */}
        <div className="relative">
          <label htmlFor="name" className="sr-only">
            Display name
          </label>
          <User aria-hidden className={iconClass} strokeWidth={1.75} />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="nickname"
            placeholder="Display name"
            required
            maxLength={40}
            className={inputClass}
          />
        </div>
        <p className="-mt-1 px-4 text-[0.75rem] text-charcoal/50">
          This is the name others see, unless you choose to stay anonymous.
        </p>

        {/* Email */}
        <div className="relative">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <Mail aria-hidden className={iconClass} strokeWidth={1.75} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            required
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <Lock aria-hidden className={iconClass} strokeWidth={1.75} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            required
            minLength={8}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/55 transition hover:text-charcoal focus-visible:outline-2 focus-visible:outline-calm"
          >
            {showPassword ? (
              <Eye aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <EyeOff aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
        <p className="-mt-1 px-4 text-[0.75rem] text-charcoal/50">
          Use at least 8 characters.
        </p>

        {/* Terms and Privacy */}
        <label className="flex items-start gap-2.5 pt-1 text-[0.75rem] leading-snug text-charcoal/65">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-softgrey accent-[#4a6b8c]"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className={linkClass}>
              Terms of Service
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
          className="h-12 w-full rounded-full bg-[#4a6b8c] text-[0.9375rem] font-medium text-white transition hover:bg-[#3f5f80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
        >
          Create account
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3 text-[0.75rem] text-charcoal/45">
        <span className="h-px flex-1 bg-softgrey" />
        or
        <span className="h-px flex-1 bg-softgrey" />
      </div>

      {/* Google */}
      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-softgrey bg-white text-[0.875rem] font-medium text-charcoal transition hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-5 text-center text-[0.75rem] text-charcoal/55">
        Already have an account?{" "}
        <Link to="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </div>
  );
}