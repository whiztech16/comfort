import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const inputClass =
  "h-12 w-full rounded-full border border-softgrey bg-white pl-11 pr-11 text-[0.875rem] text-charcoal outline-none transition placeholder:text-charcoal/45 focus:border-calm focus:ring-2 focus:ring-calm/20";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-charcoal/55";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-[18px] w-[18px]">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(38,55,70,0.18)] md:p-8">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-charcoal">
        Welcome back
      </h1>
      <p className="mt-1.5 text-[0.9rem] text-charcoal/50">
        Your space is always here for you.
      </p>

      <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
        {/* Email or username */}
        <div className="relative">
          <label htmlFor="identifier" className="sr-only">
            Email or username
          </label>
          <Mail aria-hidden className={iconClass} strokeWidth={1.75} />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Email or username"
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
            autoComplete="current-password"
            placeholder="Password"
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

        <div className="text-right">
          <Link
            to="/reset-password"
            className="text-[0.75rem] font-semibold text-charcoal underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="h-12 w-full rounded-full bg-[#4a6b8c] text-[0.9375rem] font-medium text-white transition hover:bg-[#3f5f80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
        >
          Log in
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
        New to Comfort?{" "}
        <Link
          to="/signup"
          className="font-semibold text-charcoal underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}