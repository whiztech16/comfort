import { useState } from "react";
import Modal from "../shared/Modal";
import { useToast } from "../../hooks/useToast";
import { editPost } from "../../lib/samplePosts";

const MAX = 400;

type Props = Readonly<{
  postId: string;
  initialBody: string;
  onClose: () => void;
  onSaved: (newBody: string) => void;
}>;

export default function EditPostModal({ postId, initialBody, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [body, setBody] = useState(initialBody);

  const remaining = MAX - body.length;
  const overLimit = remaining < 0;
  const empty = body.trim().length === 0;

  function handleSave() {
    if (empty || overLimit) return;
    editPost(postId, body.trim());
    showToast("Post updated.");
    onSaved(body.trim());
    onClose();
  }

  return (
    <Modal title="Edit post" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
            className="w-full resize-none rounded-2xl border border-transparent bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2 focus:ring-brand/40"
          />
          <p
            className={`mt-1 text-right text-[0.75rem] tabular-nums ${
              overLimit ? "text-[#b4443a]" : remaining <= 50 ? "text-amber-600" : "text-navy/40"
            }`}
          >
            {remaining}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleSave}
            disabled={empty || overLimit}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#527a9f] to-[#3f5f80] px-8 text-[0.9rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4a6b8c] disabled:opacity-60 sm:w-auto"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

