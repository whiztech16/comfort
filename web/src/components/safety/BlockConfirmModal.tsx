import Modal from "../shared/Modal";
import { useToast } from "../../hooks/useToast";

type BlockConfirmModalProps = Readonly<{
  name: string | null; // null when the author is anonymous
  onClose: () => void;
  onConfirm?: () => void;
}>;

export default function BlockConfirmModal({
  name,
  onClose,
  onConfirm,
}: BlockConfirmModalProps) {
  const { showToast } = useToast();
  const who = name ?? "this author";

  function handleConfirm() {
    // Later: tell the backend, which also applies the block to anonymous messages
    showToast("Blocked. You can undo this in Settings.");
    onConfirm?.();
    onClose();
  }

  return (
    <Modal
      title={`Block ${who}?`}
      description="They won’t be able to message you or interact with you. You can undo this anytime in Settings."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#b4443a] px-8 text-[0.9rem] font-semibold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4443a] sm:w-auto"
        >
          Block
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}