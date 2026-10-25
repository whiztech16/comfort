import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import footerImage from "../../assets/images/footerimg2.png";

export default function FinalCTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate flex min-h-[16rem] items-center justify-center overflow-hidden bg-[#8fbbe3] md:min-h-[20rem]"
    >
      {/* Photo */}
      <img
        src={footerImage}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />

      {/* Fade into the footer colour */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-b from-transparent to-[#dceaf7]" />

      {/* Content */}
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-10 pt-10 text-center text-charcoal md:pb-14">
        <h2
          id="cta-heading"
          className="font-serif text-[clamp(2rem,4.4vw,3.5rem)] font-normal leading-[1.1] tracking-[-0.02em]"
        >
          There’s room for kindness here.
        </h2>

        <p className="mt-5 max-w-[32rem] text-[0.9rem] leading-[1.7] text-charcoal/80 md:text-[0.95rem]">
          Whether you need a little encouragement or want to offer it to someone
          else, start with one small act of kindness.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {/* Primary: light pill with a dark arrow circle */}
          <Link
            to="/signup"
            className="group inline-flex h-11 items-center gap-4 rounded-full bg-white pl-6 pr-1.5 text-[0.875rem] font-medium text-charcoal shadow-[0_6px_24px_rgba(38,55,70,0.12)] transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
          >
            Find a little comfort
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white transition-transform group-hover:translate-x-0.5">
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </span>
          </Link>

          {/* Secondary: outlined pill */}
          <Link
            to="/explore"
            className="inline-flex h-11 items-center rounded-full border border-charcoal/50 px-6 text-[0.875rem] font-medium text-charcoal transition hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
          >
            Send kindness
          </Link>
        </div>
      </div>
    </section>
  );
}