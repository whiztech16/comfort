import { PrimaryButton } from "../shared/PrimaryButton";

type Props = Readonly<{
  phase: "idle" | "sending" | "sent";
  onContinue: () => void;
}>;

function FlappingDove() {
  return (
    <svg viewBox="-110 -30 510 450" className="h-auto w-full select-none" aria-hidden style={{ filter: "drop-shadow(0 20px 22px rgba(27,53,102,0.2))" }}>
<defs>
<path id="dove-fe" d="M0 0 C0.18 -0.55 0.72 -0.68 1 -0.12 C1.03 0 1.03 0.1 1 0.18 C0.72 0.7 0.18 0.55 0 0Z" stroke="#27303f" strokeWidth="2.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
<linearGradient id="dove-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#d6d9e6"/></linearGradient>
<linearGradient id="dove-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef0f6"/><stop offset="1" stopColor="#cfd3e2"/></linearGradient>
</defs>
<g className="dove-bob">
<g className="dove-wing-far"><g transform="translate(235 172) rotate(-56)"><use href="#dove-fe" transform="translate(0 0) rotate(-52) scale(96.0 34.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(-38) scale(108.0 35.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(-24) scale(118.0 36.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(-10) scale(124.0 36.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(4) scale(124.0 36.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(18) scale(116.0 35.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(32) scale(104.0 34.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(46) scale(90.0 32.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(0 0) rotate(-44) scale(62.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(0 0) rotate(-28) scale(72.0 27.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(0 0) rotate(-12) scale(78.0 27.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(0 0) rotate(4) scale(78.0 27.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(0 0) rotate(20) scale(72.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(0 0) rotate(36) scale(62.0 25.0)" fill="#ffffff"/></g></g>
<use href="#dove-fe" transform="translate(194 286) rotate(158) scale(92.0 26.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(194 286) rotate(206) scale(92.0 26.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(194 286) rotate(170) scale(108.0 28.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(194 286) rotate(194) scale(108.0 28.0)" fill="url(#dove-g2)"/><use href="#dove-fe" transform="translate(194 286) rotate(182) scale(118.0 30.0)" fill="url(#dove-g2)"/>
<path d="M321 182 C322 156 300 140 278 146 C262 150 252 166 250 182 C246 200 226 210 214 222 C194 240 184 262 186 290 C214 306 252 302 272 276 C292 252 306 230 308 208 C316 200 321 192 321 182Z" fill="#ffffff" stroke="#27303f" strokeWidth="2.4" strokeLinejoin="round"/>
<path d="M232 268 C250 284 268 272 280 254" fill="none" stroke="#d3d6e3" strokeWidth="5" strokeLinecap="round"/>
<path d="M287 214 q6 4 3 11 M273 228 q6 4 3 11" fill="none" stroke="#c4c8d8" strokeWidth="2.2" strokeLinecap="round"/>
<path d="M320 175 L341 184 L321 192Z" fill="#f2a0a8" stroke="#27303f" strokeWidth="2.4" strokeLinejoin="round"/>
<circle cx="296" cy="172" r="5.4" fill="#27303f"/><circle cx="297.7" cy="170.2" r="1.6" fill="#ffffff"/>
<g fill="none" stroke="#e9929a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M236 296 l-4 16 m4 -16 l8 13"/><path d="M212 300 l-4 16 m4 -16 l8 13"/></g>
<g className="dove-wing-near"><g transform="translate(205 203) rotate(-139)"><path d="M0 8 C40 20 130 18 214 3 C214 -18 190 -42 150 -62 C110 -78 50 -74 12 -52 C2 -40 0 -20 0 8Z" fill="#d9dce8"/><use href="#dove-fe" transform="translate(8 0) rotate(-72) scale(92.0 30.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(14 0) rotate(-64) scale(98.0 30.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(22 0) rotate(-56) scale(104.0 30.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(30 0) rotate(-48) scale(112.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(38 0) rotate(-41) scale(122.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(46 0) rotate(-40.0) scale(92.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(57 0) rotate(-34.8) scale(100.5 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(68 0) rotate(-29.6) scale(109.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(79 0) rotate(-24.4) scale(117.5 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(90 0) rotate(-19.2) scale(126.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(101 0) rotate(-14.0) scale(134.5 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(112 0) rotate(-8.799999999999997) scale(143.0 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(123 0) rotate(-3.6000000000000014) scale(151.5 31.0)" fill="url(#dove-g1)"/><use href="#dove-fe" transform="translate(6 3.0) rotate(-40) scale(64.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(22 2.4) rotate(-33) scale(74.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(40 1.8) rotate(-26) scale(82.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(58 1.2000000000000002) rotate(-20) scale(88.0 26.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(78 0.6000000000000001) rotate(-14) scale(92.0 25.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(100 0.0) rotate(-9) scale(90.0 24.0)" fill="#ffffff"/><use href="#dove-fe" transform="translate(122 -0.5999999999999996) rotate(-5) scale(82.0 22.0)" fill="#ffffff"/></g></g>
<g transform="translate(318 192) rotate(12)"><rect width="66" height="44" rx="3" fill="#fbf7ee" stroke="#27303f" strokeWidth="2"/><path d="M0 0 L33 25 L66 0" fill="none" stroke="#27303f" strokeWidth="1.6"/><circle cx="33" cy="27" r="8" fill="#e05656" stroke="#27303f" strokeWidth="1.4"/></g>
</g></svg>
  );
}

export default function SendingAnimation({ phase, onContinue }: Props) {
  if (phase === "idle") return null;
  const sent = phase === "sent";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white px-6 text-center"
    >
      <style>{`
        @keyframes dove-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dove-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes dove-in {
          from { opacity: 0; transform: translateY(36px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dove-flap-near {
          0%, 100% { transform: rotate(6deg); }
          50% { transform: rotate(-68deg); }
        }
        @keyframes dove-flap-far {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(62deg); }
        }
        @keyframes dove-bob {
          0%, 100% { transform: translateY(10px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes dove-away {
          0% { transform: translate(0, 0) rotate(-2deg) scale(1); opacity: 1; }
          100% { transform: translate(52vw, -78vh) rotate(-12deg) scale(0.3); opacity: 0; }
        }

        .dove-wing-near { transform-box: view-box; transform-origin: 205px 203px; transform: rotate(6deg); }
        .dove-wing-far { transform-box: view-box; transform-origin: 235px 172px; transform: rotate(-6deg); }
        .dove-enter { animation: dove-fade-in 0.7s ease-out both; }
        .dove-leave { animation: dove-fade-out 1.6s ease-in forwards; }

        @media (prefers-reduced-motion: no-preference) {
          .dove-enter { animation: dove-in 0.7s ease-out both; }
          .dove-wing-near { animation: dove-flap-near 0.8s ease-in-out infinite; }
          .dove-wing-far { animation: dove-flap-far 0.8s ease-in-out infinite; }
          .dove-bob { animation: dove-bob 0.8s ease-in-out infinite; }
          .dove-flying .dove-wing-near,
          .dove-flying .dove-wing-far,
          .dove-flying .dove-bob { animation-duration: 0.45s; }
          .dove-leave { animation: dove-away 1.6s cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
        }
      `}</style>

      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(45%_60%_at_15%_25%,rgba(111,140,202,0.35),transparent_70%),radial-gradient(40%_55%_at_92%_80%,rgba(165,190,238,0.5),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-[60%] rounded-full bg-white/70 blur-3xl"
      />

      <div className="relative">
        <div className="dove-enter">
          <div className={sent ? "dove-leave" : ""}>
            <div className={`w-[320px] sm:w-[420px] ${sent ? "dove-flying" : ""}`}>
              <FlappingDove />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 space-y-1.5">
        <p className="text-[1.25rem] font-semibold tracking-[-0.01em] text-navy">
          {sent ? "Your Comfort is on its way" : "Sending your kind words..."}
        </p>
        <p className="text-[0.875rem] text-navy/55">
          {sent ? "They’ll find it the next time they open Comfort." : "This only takes a moment."}
        </p>
      </div>

      {sent ? (
        <div className="relative mt-8">
          <PrimaryButton type="button" onClick={onContinue}>
            Done
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}