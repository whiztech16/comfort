import { useState } from "react";
import DoveAnimation from "../../components/messaging/DoveAnimation";

export default function DoveDemoPage() {
  const [flying, setFlying] = useState(false);

  return (
    <main className="flex min-h-svh items-center justify-center bg-offwhite">
      <button
        type="button"
        disabled={flying}
        onClick={() => setFlying(true)}
        className="h-12 rounded-full bg-[#4a6b8c] px-8 text-[0.9rem] font-medium text-white transition hover:bg-[#3f5f80] disabled:opacity-60"
      >
        Send comfort
      </button>

      {flying && <DoveAnimation onDone={() => setFlying(false)} />}
    </main>
  );
}