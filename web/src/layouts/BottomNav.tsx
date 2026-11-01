import { Link, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { navItems } from "./navitems";
import type { NavItemType } from "./navitems";
import LiquidGlassFilter from "./LiquidGlassFilter";

// Order in navItems: Home, Explore, Create, Inbox, Profile
const [home, explore, , inbox, profile] = navItems;

function NavItem({ to, label, icon: Icon, badge }: Readonly<NavItemType>) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-2xl px-3.5 py-1.5 text-[0.6875rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
          isActive ? "liquid-pill text-navy" : "text-navy/60 hover:text-navy"
        }`
      }
    >
      <span className="relative">
        <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-deep px-1 text-[0.625rem] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden"
    >
      <LiquidGlassFilter />

      <div className="liquid-glass liquid-glass-nav mx-auto flex max-w-md items-center justify-between rounded-[2rem] px-3 py-2">
        <NavItem {...home} />
        <NavItem {...explore} />

        <Link
          to="/posts/new"
          aria-label="New post"
          className="-mt-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#86a0d8]/95 to-[#6a88c8]/95 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(255,255,255,0.25),0_10px_24px_rgba(79,109,171,0.4)] ring-4 ring-white/60 transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
        >
          <Plus aria-hidden className="h-6 w-6" strokeWidth={2} />
        </Link>

        <NavItem {...inbox} />
        <NavItem {...profile} />
      </div>
    </nav>
  );
}