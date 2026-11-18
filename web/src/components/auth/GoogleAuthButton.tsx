import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "./Googleicon";
import { googleSignInApi } from "../../lib/api";
import { useToast } from "../../hooks/useToast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

// Google must be initialized only once per page load, not once per render
let googleInitialized = false;
let credentialHandler: ((credential: string) => void) | null = null;

type GoogleAuthButtonProps = {
  text?: "Continue with Google" | "Sign up with Google";
};

export default function GoogleAuthButton({ text = "Continue with Google" }: GoogleAuthButtonProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleCredential = async (credential: string) => {
    try {
      setLoading(true);
      const data = await googleSignInApi(credential);
      showToast("Welcome to Comfort 💙");
      if (data?.user?.onboardingCompleted) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // Always points at the latest handler, so the effect below never needs to re-run
  const handlerRef = useRef(handleCredential);
  useEffect(() => {
    handlerRef.current = handleCredential;
  });

  useEffect(() => {
    if (!clientId) return;

    credentialHandler = (credential) => {
      void handlerRef.current(credential);
    };

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const setup = () => {
      if (cancelled) return;

      const gid = window.google?.accounts?.id;
      if (!gid) {
        timer = setTimeout(setup, 200);
        return;
      }

      if (!googleInitialized) {
        gid.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) credentialHandler?.(response.credential);
          },
        });
        googleInitialized = true;
      }

      const el = overlayRef.current;
      if (el) {
        el.innerHTML = "";
        gid.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(Math.round(el.offsetWidth) || 320, 400),
        });
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      credentialHandler = null;
    };
  }, [clientId]);

  return (
    <div className="group relative w-full">
      {/* Your styled button: visual only, clicks go to Google's button on top of it */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-black bg-white text-[0.8125rem] font-medium text-charcoal transition group-hover:bg-offwhite disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Signing in..." : text}
      </button>

      {/* Google's real button, invisible, covering the styled button */}
      <div
        ref={overlayRef}
        onClick={() => {
          if (!clientId) {
            showToast("Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in web/.env");
          }
        }}
        className={`absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.01] ${
          loading ? "pointer-events-none" : ""
        }`}
      />
    </div>
  );
}