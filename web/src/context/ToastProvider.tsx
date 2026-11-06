import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "../hooks/useToast";

export default function ToastProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(""), 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 lg:bottom-6">
        <p
          role="status"
          className={
            message
              ? "rounded-full bg-navy px-4 py-2.5 text-[0.8125rem] font-medium text-white shadow-lg"
              : "sr-only"
          }
        >
          {message}
        </p>
      </div>
    </ToastContext.Provider>
  );
}