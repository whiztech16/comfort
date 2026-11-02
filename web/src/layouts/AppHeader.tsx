import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import Avatar from "../components/shared/Avatar";
import logo from "../assets/images/comfort-logo.png";

const circle =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3fa] text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 lg:max-w-none lg:px-8">
        {/* Mobile only: logo (white PNG filtered dark so it shows on white header) */}
        <Link
          to="/home"
          aria-label="Comfort home"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:hidden"
        >
          <img src={logo} alt="Comfort" className="h-6 w-auto brightness-0" />
        </Link>

        {/* Desktop: search box */}
        <label className="hidden h-11 w-full max-w-md items-center gap-3 rounded-full bg-[#f1f3fa] px-4 lg:flex">
          <Search
            aria-hidden
            className="h-[18px] w-[18px] shrink-0 text-navy/50"
            strokeWidth={1.75}
          />
          <span className="sr-only">Search Comfort</span>
          <input
            type="search"
            placeholder="Search Comfort…"
            className="w-full bg-transparent text-[0.875rem] text-navy outline-none placeholder:text-navy/45"
          />
        </label>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className={circle}>
            <Bell aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Search"
            className={`${circle} lg:hidden`}
          >
            <Search aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <span className="hidden lg:block">
            <Avatar name="Fortune" />
          </span>
        </div>
      </div>
    </header>
  );
}
