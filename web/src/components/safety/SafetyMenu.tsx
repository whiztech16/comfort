import { useEffect, useRef, useState } from "react";
import { Ban, Ellipsis, Flag } from "lucide-react";
import ReportModal from "./ReportModal";
import type { ReportKind } from "./ReportModal";
import BlockConfirmModal from "./BlockConfirmModal";

const menuItem =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.875rem] font-medium text-navy transition hover:bg-[#f1f3fa] focus-visible:outline-2 focus-visible:outline-brand-deep";

type SafetyMenuProps = Readonly<{
  name: string | null; // null when the person is anonymous
  reportKind: ReportKind;
}>;

// The "..." menu with Report and Block, used on posts, messages and profiles
export default function SafetyMenu({ name, reportKind }: SafetyMenuProps) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"report" | "block" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  function choose(next: "report" | "block") {
    setOpen(false);
    setModal(next);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More options"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-1.5 text-navy/50 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
      >
        <Ellipsis aria-hidden className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          role="group"
          aria-label="Safety options"
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_12px_32px_rgba(27,53,102,0.14)]"
        >
          <button type="button" onClick={() => choose("report")} className={menuItem}>
            <Flag aria-hidden className="h-[18px] w-[18px] text-navy/60" strokeWidth={1.75} />
            Report {reportKind}
          </button>
          <button type="button" onClick={() => choose("block")} className={menuItem}>
            <Ban aria-hidden className="h-[18px] w-[18px] text-navy/60" strokeWidth={1.75} />
            Block {name ?? "this person"}
          </button>
        </div>
      ) : null}

      {modal === "report" ? (
        <ReportModal kind={reportKind} onClose={() => setModal(null)} />
      ) : null}
      {modal === "block" ? (
        <BlockConfirmModal name={name} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}