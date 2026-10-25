import { Link } from "react-router-dom";
import heroImage from "../../assets/images/comfort.png";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#bed0e2]">
      {/* Content: sits above the photo on mobile/tablet, centered on large screens */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-8 pt-[clamp(6rem,24svh,12rem)] text-center text-white [@media(max-height:620px)]:pt-24 lg:pb-0 lg:pt-16">
        <h1 className="font-serif text-[clamp(2.75rem,6.7vw,5.75rem)] font-normal leading-[1.1] tracking-[-0.02em] [text-shadow:0_1px_24px_rgba(0,0,0,0.18)]">
          A little kindness
          <br />
          goes a long way.
        </h1>

        <p className="mt-6 max-w-[19rem] text-[0.9rem] leading-[1.7] text-white/95 [text-shadow:0_1px_16px_rgba(0,0,0,0.2)] md:max-w-[32rem] md:text-[0.95rem] lg:mt-7">
          Whether you're feeling lonely, going through something difficult, or simply need someone to talk to, there's a place for you here
        </p>

        <Link
          to="/signup"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-8 text-[0.9rem] font-medium text-[#15191d] transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:mt-12 lg:h-14"
        >
          Find comfort
        </Link>
      </div>

      {/* Photo: below the text on mobile/tablet, full-bleed behind it on large screens */}
      <img
        src={heroImage}
        alt="Three friends sharing a warm moment in golden-hour light"
        className="relative -mt-[min(30vw,15.6svh)] h-[min(100vw,52svh)] w-full object-cover object-[88%_center] [mask-image:linear-gradient(to_bottom,transparent,black_28%)] lg:absolute lg:inset-0 lg:-z-20 lg:mt-0 lg:h-full lg:object-[70%_center] lg:[mask-image:none]"
      />

      {/* Soft overlay, large screens only */}
      <div className="absolute inset-0 -z-10 hidden bg-black/15 lg:block" />
    </section>
  );
}