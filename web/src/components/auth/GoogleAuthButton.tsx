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

type GoogleAuthButtonProps = {
  text?: "Continue with Google" | "Sign up with Google";
};

export default function GoogleAuthButton({ text = "Continue with Google" }: GoogleAuthButtonProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) return;

    function initGoogle() {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            setLoading(true);
            const data = await googleSignInApi(response.credential);
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
        },
      });

      // Render official Google button into the hidden container so we can trigger it directly
      if (hiddenBtnRef.current) {
        window.google.accounts.id.renderButton(hiddenBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
        });
      }
    }

    initGoogle();
  }, [clientId, navigate, showToast]);

  function handleClick() {
    if (!clientId) {
      showToast("Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in web/.env");
      return;
    }

    // Trigger the official Google prompt or click the rendered button
    if (hiddenBtnRef.current?.querySelector("div[role=button]")) {
      (hiddenBtnRef.current.querySelector("div[role=button]") as HTMLElement).click();
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-black bg-white text-[0.8125rem] font-medium text-charcoal transition hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Signing in..." : text}
      </button>

      {/* Hidden container used to mount Google's official iframe button for native popup handling */}
      <div
        ref={hiddenBtnRef}
        className="pointer-events-none absolute left-0 top-0 opacity-0 overflow-hidden w-0 h-0"
        aria-hidden="true"
      />
    </div>
  );
}

