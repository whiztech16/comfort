import { Link } from "react-router-dom";
import logo from "../../assets/images/comfort-logo.png";

const linkClass =
  "hidden h-10 items-center rounded-full px-5 text-[0.8125rem] font-semibold text-white transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex";

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        aria-label="Main"
        className="relative flex items-center justify-between gap-6 px-5 pt-4 md:px-12"
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="Comfort home"
          className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <img src={logo} alt="Comfort" className="h-5 w-auto md:h-8" />
        </Link>

        {/* Glass pill */}
        <div className="flex shrink-0 items-center rounded-full border border-white/50 bg-gradient-to-b from-white/25 via-white/10 to-black/20 p-[2px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl backdrop-saturate-150 md:absolute md:left-1/2 md:top-4 md:-translate-x-1/2 md:p-[3px]">
          <Link to="/how-it-works" className={linkClass}>
            How it works
          </Link>

          <Link to="/explore" className={linkClass}>
            Explore
          </Link>

          <Link
            to="/signup"
            className="inline-flex h-8 items-center rounded-full bg-[#15191d] px-4 text-[0.75rem] font-semibold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:h-10 md:px-7 md:text-[0.8125rem]"
          >
            Join Comfort
          </Link>
        </div>
      </nav>
    </header>
  );
}