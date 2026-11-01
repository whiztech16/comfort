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
  "welcome-card absolute aspect-[4/5] w-[40cqw] overflow-hidden rounded-[1.5rem] shadow-[0_16px_36px_rgba(38,55,70,0.22)] ring-[4px] ring-white";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

export default function WelcomeScreen() {
  return (
    <main className="flex min-h-svh justify-center bg-gradient-to-b from-[#dceaf7] via-[#eef4fa] to-white md:items-center">
      <div className="flex min-h-svh w-full max-w-[28rem] flex-col px-6 pb-7 pt-9 md:min-h-0 md:py-10">
        {/* Stacked photo cards */}
        <div
          aria-hidden
          className="@container relative mx-auto aspect-[100/78] w-full shrink-0"
        >
          <div
            className={`${cardClass} left-[60cqw] top-[14cqw] z-0 rotate-[9deg]`}
            style={delay(0.15)}
          >
            <img src={supportImg} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={`${cardClass} left-[30cqw] top-0 z-10 rotate-[-3deg]`}
            style={delay(0)}
          >
            <img src={receiveImg} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={`${cardClass} left-0 top-[18cqw] z-20 rotate-[-10deg]`}
            style={delay(0.3)}
          >
            <img src={shareImg} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Welcome text */}
        <h1
          className="welcome-rise mt-8 text-center text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-charcoal"
          style={delay(0.5)}
        >
          Welcome to{" "}
          <span className="font-serif text-[1.875rem] font-medium">Comfort</span>
        </h1>
        <p
          className="welcome-rise mx-auto mt-2.5 max-w-[21rem] text-center text-[0.85rem] leading-[1.6] text-charcoal/60"
          style={delay(0.6)}
        >
          A gentle space to share what’s on your mind, receive thoughtful
          messages, and offer kindness to others.
        </p>

        {/* Feature pills */}
        <ul className="mt-6 space-y-2.5">
          {points.map(({ icon: Icon, text }, i) => (
            <li
              key={text}
              className="welcome-rise flex items-center gap-3 rounded-full bg-[#f5f8f2] py-2 pl-2.5 pr-5 shadow-[0_1px_2px_rgba(38,55,70,0.04)]"
              style={delay(0.7 + i * 0.1)}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a93f2] text-white">
                <Icon aria-hidden className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-charcoal">
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* Button: pinned to the bottom on phones */}
        <div className="welcome-rise mt-auto pt-7 md:mt-2" style={delay(1.05)}>
          <Link
            to="/home"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#527a9f] to-[#3f5f80] text-[0.9rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_rgba(63,95,128,0.3)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4a6b8c]"
          >
            Let’s get started
          </Link>
        </div>
      </div>
    </main>
  );
}