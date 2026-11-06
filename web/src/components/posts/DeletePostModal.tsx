import Modal from "../shared/Modal";
import { useToast } from "../../hooks/useToast";

type DeletePostModalProps = Readonly<{
  onClose: () => void;
  onConfirm: () => void;
}>;

export default function DeletePostModal({
  onClose,
  onConfirm,
}: DeletePostModalProps) {
  const { showToast } = useToast();

  function handleConfirm() {
    // Later: tell the backend, which also removes the post from shared links
    onConfirm();
    showToast("Post deleted.");
    onClose();
  }

  return (
    <Modal
      title="Delete this post?"
      description="It will be removed for everyone, including any shared links. This can’t be undone."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#b4443a] px-8 text-[0.9rem] font-semibold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4443a] sm:w-auto"
        >
          Delete
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