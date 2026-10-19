import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-black bg-white px-3.5 text-[0.875rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-black focus:ring-2 focus:ring-black/15";

const labelClass = "block text-[0.875rem] font-medium text-charcoal";

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
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_16px_50px_rgba(38,55,70,0.14)] sm:p-7">
      <h1 className="text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-charcoal sm:text-[1.625rem]">
        Welcome back
      </h1>
      <p className="mt-1 text-[0.85rem] text-charcoal/55">
        Your space is always here for you.
      </p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Email or username */}
        <div>
          <label htmlFor="identifier" className={labelClass}>
            Email or username
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="e.g. alex@example.com"
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <Link
              to="/reset-password"
              className="text-[0.75rem] font-semibold text-charcoal underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="e.g. enter your password"
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

        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-lg bg-[#4a6b8c] text-[0.875rem] font-medium text-white transition hover:bg-[#3f5f80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm"
        >
          Log in
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