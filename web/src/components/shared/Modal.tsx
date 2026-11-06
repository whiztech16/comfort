import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = Readonly<{
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}>;

export default function Modal({
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // The browser's own dialog gives us focus handling and the Escape key
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // A tap on the dimmed area outside the panel closes it
        if (event.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[90svh] w-full max-w-none overflow-y-auto rounded-t-3xl border-0 bg-white p-0 text-navy shadow-2xl backdrop:bg-navy/40 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="text-[1.25rem] font-semibold tracking-[-0.01em] text-navy"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1.5 text-[0.875rem] leading-snug text-navy/60"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy/60 transition hover:bg-[#f1f3fa] hover:text-navy focus-visible:outline-2 focus-visible:outline-brand-deep"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}