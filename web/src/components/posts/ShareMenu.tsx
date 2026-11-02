import { useEffect, useRef, useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";
import { copyText, postUrl, shareText } from "../../lib/share";
import { actionButton } from "./actionStyles";

const menuItem =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.875rem] font-medium text-navy transition hover:bg-[#f1f3fa] focus-visible:outline-2 focus-visible:outline-brand-deep";

export default function ShareMenu({ postId }: Readonly<{ postId: string }>) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Close on outside tap or Escape
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Hide the "Link copied" note after a moment
  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    const copied = await copyText(postUrl(postId));
    setStatus(copied ? "Link copied" : "Couldn’t copy the link");
    setOpen(false);
  }

  async function handleNativeShare() {
    setOpen(false);
    try {
      await navigator.share({
        title: "Comfort",
        text: shareText,
        url: postUrl(postId),
      });
    } catch {
      // The share sheet was closed. Nothing to do.
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${postUrl(postId)}`
  )}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Share post"
        onClick={() => setOpen((value) => !value)}
        className={actionButton}
      >
        <Share2 aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open ? (
        <div
          role="group"
          aria-label="Share options"
          className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_12px_32px_rgba(27,53,102,0.14)]"
        >
          <button type="button" onClick={handleCopy} className={menuItem}>
            <Link2 aria-hidden className="h-[18px] w-[18px] text-brand-deep" strokeWidth={1.75} />
            Copy link
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={menuItem}
          >
            <MessageCircle aria-hidden className="h-[18px] w-[18px] text-brand-deep" strokeWidth={1.75} />
            WhatsApp
          </a>

          {canNativeShare ? (
            <button type="button" onClick={handleNativeShare} className={menuItem}>
              <Share2 aria-hidden className="h-[18px] w-[18px] text-brand-deep" strokeWidth={1.75} />
              More options…
            </button>
          ) : null}
        </div>
      ) : null}

      <p
        role="status"
        className={
          status
            ? "absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-[0.75rem] font-medium text-white shadow-lg"
            : "sr-only"
        }
      >
        {status}
      </p>
    </div>
  );
}