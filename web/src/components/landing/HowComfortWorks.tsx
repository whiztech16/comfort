import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import shareImg from "../../assets/images/card1img.webp";
import receiveImg from "../../assets/images/card2 img.webp";
import supportImg from "../../assets/images/card3img.webp";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const steps = [
  { 
    n: "01",
    label: "Share",
    title: "Share your feelings",
    text: "Express what you're going through in your own words, at your own pace.",
    image: shareImg,
    alt: "A woman resting her chin on her hand, looking thoughtfully out of a window",
  },
  {
    n: "02",
    label: "Receive",
    title: "Receive kindness",
    text: "Open thoughtful messages whenever you're ready. You never have to reply.",
    image: receiveImg,
    alt: "A man smiling softly as he reads a letter",
  },
  {
    n: "03",
    label: "Support",
    title: "Support someone",
    text: "Send encouragement to someone who might appreciate a little kindness.",
    image: supportImg,
    alt: "Two friends sitting close, one resting a comforting hand on the other",
  },
];

export default function HowComfortWorks() {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 1023px)", () => {
      const getShift = () =>
        Math.max(track.scrollWidth - window.innerWidth, 0);

      if (getShift() <= 0) return;

      gsap.to(track, {
        x: () => -getShift(),
        y: () => {
          const topPad = parseFloat(getComputedStyle(pin).paddingTop) || 0;
          const centered = (window.innerHeight - track.offsetHeight) / 2;
          return Math.max(centered - topPad, 0);
        },
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${getShift()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      mm.revert();
    };
  }, []);

  return (
    <section
      aria-labelledby="how-heading"
      className="max-lg:-mb-[calc((100svh_-_1.25*min(80vw,30rem,46svh))/2_-_2.5rem)] max-lg:pt-14 lg:pb-12 lg:pt-20"
    >
      {/* Heading: not pinned, scrolls away normally */}
      <div className="mb-6 px-5 md:px-12 lg:mb-10 lg:px-[5.7%]">
        <h2
          id="how-heading"
          className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-charcoal"
        >
          How Comfort works
        </h2>
      </div>

      {/* Pinned part: only the cards, one screen tall below lg */}
      <div
        ref={pinRef}
        className="max-lg:h-svh max-lg:overflow-hidden max-lg:pt-6"
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4 px-5 will-change-transform md:px-12 lg:grid lg:w-auto lg:grid-cols-3 lg:gap-8 lg:px-[2.7%]"
        >
          {steps.map((step) => (
            <article
              key={step.n}
              className="relative aspect-[4/5] w-[min(80vw,30rem,46svh)] shrink-0 overflow-hidden rounded-2xl lg:aspect-[535/518] lg:w-auto"
            >
              <img
                src={step.image}
                alt={step.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-x-3 bottom-3 flex h-[6.75rem] flex-col justify-center rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-white backdrop-blur-md [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] lg:inset-x-4 lg:bottom-4 lg:h-[7rem] lg:px-4 lg:py-3">
                <p className="text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-white/80 lg:text-[0.625rem]">
                  {step.n} / {step.label}
                </p>
                <h3 className="mt-1 text-[0.875rem] font-normal leading-tight lg:text-[0.9375rem]">
                  {step.title}
                </h3>
                <p className="mt-1 text-[0.7rem] leading-[1.4] text-white/90 lg:text-[0.75rem]">
                  {step.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}