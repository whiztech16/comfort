import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "../shared/Modal";
import { PrimaryButton } from "../shared/PrimaryButton";
import { useToast } from "../../hooks/useToast";

export type ReportKind = "post" | "message" | "profile";

type ReportModalProps = Readonly<{
  kind: ReportKind;
  onClose: () => void;
  onSubmitted?: () => void;
}>;

const reasons = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate", label: "Hate or discrimination" },
  { id: "spam", label: "Spam or scam" },
  { id: "personal-info", label: "Sharing someone’s personal information" },
  { id: "self-harm", label: "Self-harm or suicide concern" },
  { id: "other", label: "Something else" },
] as const;

export default function ReportModal({
  kind,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) {
      setShowError(true);
      return;
    }
    // Later: send { kind, reason, details } to the backend
    showToast("Thanks for letting us know. We’ll review it.");
    onSubmitted?.();
    onClose();
  }

  return (
    <Modal
      title={`Report this ${kind}`}
      description="Tell us what’s wrong. Your report is private."
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit}>
        <fieldset>
          <legend className="sr-only">Reason for the report</legend>
          <div className="space-y-2">
            {reasons.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/[0.08] px-4 py-3 text-[0.9rem] text-navy transition has-[:checked]:border-brand-deep has-[:checked]:bg-[#f1f3fa]"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item.id}
                  checked={reason === item.id}
                  onChange={() => {
                    setReason(item.id);
                    setShowError(false);
                  }}
                  className="h-4 w-4 accent-[#4f6dab]"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        {showError ? (
          <p role="alert" className="mt-3 text-[0.8125rem] text-[#b4443a]">
            Please choose a reason.
          </p>
        ) : null}

        {reason === "self-harm" ? (
          <p className="mt-4 rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] leading-snug text-navy/80">
            If someone may be in immediate danger, please contact your local
            emergency services. Comfort can’t send help to them.
          </p>
        ) : null}

        <label
          htmlFor="report-details"
          className="mt-5 block text-[0.8125rem] font-medium text-navy"
        >
          More details <span className="font-normal text-navy/50">(optional)</span>
        </label>
        <textarea
          id="report-details"
          rows={3}
          maxLength={300}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="mt-2 w-full resize-none rounded-2xl bg-[#f1f3fa] px-4 py-3 text-[0.875rem] text-navy outline-none placeholder:text-navy/45 focus:ring-2 focus:ring-brand/40"
          placeholder="Anything that would help us understand"
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <PrimaryButton type="submit" className="w-full sm:w-auto">
            Send report
          </PrimaryButton>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}