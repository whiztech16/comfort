import { Link } from "react-router-dom";
import { PenLine, MailOpen, HeartHandshake } from "lucide-react";
import shareImg from "../../assets/images/card1img.png";
import receiveImg from "../../assets/images/card2img.png";
import supportImg from "../../assets/images/card3img.png";

const points = [
  { icon: PenLine, text: "Share your feelings, at your pace" },
  { icon: MailOpen, text: "Receive kindness. No reply needed." },
  { icon: HeartHandshake, text: "Send encouragement to someone" },
];

// Sizes use "cqw" (1% of the stack's width), so the cards scale with the screen
const cardClass =
  "absolute aspect-[4/5] w-[44cqw] overflow-hidden rounded-[1.75rem] shadow-[0_18px_40px_rgba(38,55,70,0.22)] ring-[5px] ring-white";

export default function WelcomeScreen() {
  return (
    <main className="flex min-h-svh justify-center bg-gradient-to-b from-[#dceaf7] via-[#eef4fa] to-white md:items-center">
      <div className="flex min-h-svh w-full max-w-[30rem] flex-col px-6 pb-8 pt-10 md:min-h-0 md:py-12">
        {/* Stacked photo cards */}
        <div
          aria-hidden
          className="@container relative mx-auto aspect-[100/86] w-full shrink-0"
        >
          <div
            className={`${cardClass} left-[56cqw] top-[16cqw] z-0 rotate-[9deg]`}
          >
            <img src={supportImg} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={`${cardClass} left-[28cqw] top-0 z-10 rotate-[-3deg]`}
          >
            <img src={receiveImg} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={`${cardClass} left-0 top-[20cqw] z-20 rotate-[-10deg]`}
          >
            <img src={shareImg} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Welcome text */}
        <h1 className="mt-10 text-center text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-charcoal">
          Welcome to{" "}
          <span className="font-serif text-[2rem] font-medium">Comfort</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[22rem] text-center text-[0.9rem] leading-[1.6] text-charcoal/60">
          A gentle space to share what’s on your mind, receive thoughtful
          messages, and offer kindness to others.
        </p>

        {/* Feature rows */}
        <ul className="mt-7 space-y-2.5">
          {points.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-[#4a6b8c]/15 bg-white/70 px-3.5 py-3 shadow-[0_1px_2px_rgba(38,55,70,0.04)] backdrop-blur-md"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4a6b8c]/10 text-[#4a6b8c]">
                <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="text-[0.875rem] font-medium text-charcoal">
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* Button: pinned to the bottom on phones */}
        <div className="mt-auto pt-8 md:mt-2">
          <Link
            to="/onboarding/name"
            className="flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#527a9f] to-[#3f5f80] text-[0.9375rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_rgba(63,95,128,0.3)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4a6b8c]"
          >
            Let’s get started
          </Link>
        </div>
      </div>
    </main>
  );
}