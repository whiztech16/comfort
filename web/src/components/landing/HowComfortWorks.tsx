import shareImg from "../../assets/images/card1img.png";
import receiveImg from "../../assets/images/card2img.png";
import supportImg from "../../assets/images/card3img.png";

const steps = [
  {
    n: "01",
    label: "Share",
    title: "Share your feelings",
    text: "Express what you're going through in your own words, at your own pace.",
    image: shareImg,
    alt: "A man resting his chin on his hand, looking thoughtfully out of a window",
  },
  {
    n: "02",
    label: "Receive",
    title: "Receive kindness",
    text: "Open thoughtful messages whenever you're ready. You never have to reply.",
    image: receiveImg,
    alt: "A woman smiling softly as she reads a letter",
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
  return (
    <section aria-labelledby="how-heading" className="bg-white py-10 lg:py-20">
      {/* Heading */}
      <div className="px-5 mb-6 md:px-12 lg:mb-10 lg:px-[5.7%]">
        <h2
          id="how-heading"
          className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-charcoal"
        >
          How Comfort works
        </h2>
      </div>

      {/* Cards: native scroll snap on mobile/tablet, 3-col grid on lg */}
      <div className="flex gap-4 px-5 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-[2.7%]">
        {steps.map((step) => (
          <article
            key={step.n}
            className="relative aspect-[4/5] w-[min(80vw,30rem,46svh)] shrink-0 snap-start overflow-hidden rounded-2xl lg:aspect-[535/518] lg:w-auto lg:snap-none"
          >
            <img
              src={step.image}
              alt={step.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Glass text panel */}
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
    </section>
  );
}