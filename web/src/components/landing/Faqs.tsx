import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import FaqItem from "./FaqItem";
import { faqs } from "./faqData";

const CTA_LABEL = "Get started";
const CTA_HREF = "/signup";

export default function Faqs() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" aria-labelledby={`${baseId}-title`} className="px-4 pb-12 sm:px-6 sm:pb-16 lg:pb-20">
      <style>{`
        .faq-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 320ms cubic-bezier(0.2, 0.7, 0.2, 1); }
        .faq-panel[data-open="true"] { grid-template-rows: 1fr; }
        .faq-panel > div { overflow: hidden; min-height: 0; }
        @media (prefers-reduced-motion: reduce) {
          .faq-panel { transition: none; }
        }
      `}</style>

      <h2
        id={`${baseId}-title`}
        className="mx-auto mb-6 max-w-6xl text-[2rem] font-normal leading-[1.1] tracking-[-0.03em] text-navy sm:mb-8 sm:text-[2.75rem]"
      >
     Questions 
      </h2>

      <div className="relative mx-auto max-w-6xl overflow-hidden bg-[#1a2238] md:min-h-[46rem]">
        <img
          src="/faq-bg.webp"
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-64 w-full select-none object-cover sm:h-80 md:absolute md:left-0 md:top-0 md:h-full md:w-[150%] md:max-w-none"
          style={{ objectPosition: "50% 22%" }}
        />

        <div className="relative bg-white p-6 sm:p-9 md:m-5 md:w-[46%] md:rounded-xl">
          <span className="inline-block rounded-full bg-[#eef1fa] px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-navy/70">
            FAQs
          </span>

          <h3 className="mt-4 max-w-md text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] text-navy sm:text-[2.5rem]">
            A few things you might be wondering.
          </h3>

          <div className="mt-8 border-t border-black/[0.08]">
            {faqs.map((item, index) => (
              <FaqItem
                key={item.question}
                id={`${baseId}-${index}`}
                question={item.question}
                answer={item.answer}
                open={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>

          <Link
            to={CTA_HREF}
            className="mt-8 inline-flex h-11 items-center gap-3 rounded-full border border-black/[0.1] bg-white py-1 pl-5 pr-1 text-[0.8125rem] font-medium text-navy transition hover:bg-[#f8fafd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            {CTA_LABEL}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white">
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}