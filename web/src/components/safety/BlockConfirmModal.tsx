import { useState } from "react";
import Modal from "../shared/Modal";
import { useToast } from "../../hooks/useToast";

type BlockConfirmModalProps = Readonly<{
  name: string | null;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
}>;

function errorText(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  return e.message || "We couldn’t block this person. Please try again.";
}

export default function BlockConfirmModal({ name, onClose, onConfirm }: BlockConfirmModalProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const who = name ?? "Anonymous User";

  async function handleConfirm() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
      showToast("Blocked. You can undo this in Settings.");
      onClose();
    } catch (err: unknown) {
      setError(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Block ${who}?`}
      description="They won’t be able to message you or interact with you. You can undo this anytime in Settings."
      onClose={onClose}
    >
      {error ? (
        <p role="alert" className="mb-3 text-[0.8125rem] text-[#b4443a]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={() => {
            handleConfirm().catch(() => undefined);
          }}
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#b4443a] px-8 text-[0.9rem] font-semibold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4443a] disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Blocking…" : "Block"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}