import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const primaryButtonClass =
  "inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-b from-[#2f4559] to-[#1e2f3d] px-8 text-[0.9rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(30,47,61,0.35)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#243447] disabled:opacity-60";

export function PrimaryLink({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={`${primaryButtonClass} ${className}`}>
      {children}
    </Link>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`${primaryButtonClass} ${className}`}
    >
      {children}
    </button>
  );
}