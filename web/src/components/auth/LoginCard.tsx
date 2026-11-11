import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";
import { loginApi } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { isPrivateDevice, setPrivateDevice } from "../../lib/chatKeys";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-black bg-white px-3.5 text-[0.875rem] text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-black focus:ring-2 focus:ring-black/15";

const labelClass = "block text-[0.875rem] font-medium text-charcoal";

export default function LoginCard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(() => isPrivateDevice());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setPrivateDevice(isPrivate);
      const data = await loginApi(email.trim(), password);
      showToast("Welcome back 💙");
      if (data?.user?.onboardingCompleted) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_16px_50px_rgba(38,55,70,0.14)] sm:p-7">
      <h1 className="text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-charcoal sm:text-[1.625rem]">
        Welcome back
      </h1>
      <p className="mt-1 text-[0.85rem] text-charcoal/55">
        Your space is always here for you.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-[#fff1f0] border border-[#ffccc7] p-3 text-[0.8125rem] text-[#b4443a]">
          {error}
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="e.g. alex@example.com"
            className={inputClass}
          />
        </div>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
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

        <div className="flex items-center gap-2 pt-1">
          <input
            id="private-device"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => {
              setIsPrivate(e.target.checked);
              setPrivateDevice(e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300 text-[#4a6b8c] accent-[#4a6b8c] focus:ring-[#4a6b8c]"
          />
          <label
            htmlFor="private-device"
            className="text-[0.8125rem] text-charcoal/80 cursor-pointer select-none"
          >
            This is my private device
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 h-11 w-full rounded-lg bg-[#4a6b8c] text-[0.875rem] font-medium text-white transition hover:bg-[#3f5f80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[0.7rem] text-charcoal/45">
        <span className="h-px flex-1 bg-softgrey" />
        or
        <span className="h-px flex-1 bg-softgrey" />
      </div>

      <GoogleAuthButton text="Continue with Google" />

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
