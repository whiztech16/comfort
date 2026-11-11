import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";

export default function ForgotPassphrasePage() {
  return (
    <div className="space-y-6">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back to Settings
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Forgot chat passphrase?
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          How end-to-end encryption recovery works on Comfort.
        </p>
      </section>

      {/* Honest Warning Card */}
      <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="space-y-3 text-[0.9rem] leading-relaxed text-navy/80">
            <h2 className="text-[1.125rem] font-semibold text-navy">
              Old chats cannot be recovered without your passphrase
            </h2>
            <p>
              Comfort is built with <strong>zero-knowledge end-to-end encryption</strong>. Your chat passphrase is never sent to our servers, and we do not hold a master key.
            </p>
            <p>
              If you forget your passphrase and have logged out of all active devices holding your key, neither Comfort nor anyone else can decrypt your past conversation history.
            </p>
            <p className="text-[0.85rem] text-navy/60">
              If you still have another phone, tablet, or browser where Comfort is currently open and unlocked, you can change your passphrase from that device’s settings.
            </p>
          </div>
        </div>
      </div>

      {/* Start Fresh Card */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef1fa] text-brand-deep">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="space-y-3 text-[0.9rem] leading-relaxed text-navy/80">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.125rem] font-semibold text-navy">
                Start fresh
              </h2>
              <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[0.7rem] font-medium text-navy/60">
                Coming soon
              </span>
            </div>
            <p>
              In a future update, you’ll be able to reset your cryptographic keys and start fresh conversations with a new passphrase, without accessing your past locked messages.
            </p>
            <div className="pt-2">
              <button
                type="button"
                disabled
                className="inline-flex h-11 items-center justify-center rounded-full bg-black/10 px-6 text-[0.875rem] font-medium text-navy/40 cursor-not-allowed"
              >
                Reset keys & start fresh (Coming soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
