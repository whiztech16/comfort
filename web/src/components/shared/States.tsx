

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, TriangleAlert } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

type EmptyStateProps = Readonly<{
  title: string;
  text: string;
  icon?: LucideIcon;
  action?: ReactNode;
}>;

export function EmptyState({
  title,
  text,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-black/[0.06] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3fa] text-brand-deep">
        <Icon aria-hidden className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-[1rem] font-semibold text-navy">{title}</h2>
      <p className="mt-1 max-w-[18rem] text-[0.875rem] leading-snug text-navy/60">
        {text}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = Readonly<{
  title?: string;
  text?: string;
  onRetry?: () => void;
}>;

export function ErrorState({
  title = "Something went wrong",
  text = "Please try again in a moment.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-black/[0.06] px-6 py-12 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fbeceb] text-[#b4443a]">
        <TriangleAlert aria-hidden className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-[1rem] font-semibold text-navy">{title}</h2>
      <p className="mt-1 max-w-[18rem] text-[0.875rem] leading-snug text-navy/60">
        {text}
      </p>
      {onRetry ? (
        <div className="mt-5">
          <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}

// Grey placeholder shaped like a post while real posts load
export function PostSkeleton() {
  return (
    <div
      aria-hidden
      className="animate-pulse rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-[#eceff6]" />
        <div className="space-y-2">
          <span className="block h-3 w-28 rounded-full bg-[#eceff6]" />
          <span className="block h-2.5 w-16 rounded-full bg-[#f1f3fa]" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <span className="block h-3 w-full rounded-full bg-[#eceff6]" />
        <span className="block h-3 w-11/12 rounded-full bg-[#eceff6]" />
        <span className="block h-3 w-2/3 rounded-full bg-[#eceff6]" />
      </div>
    </div>
  );
}