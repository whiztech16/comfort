import { Link, NavLink, useMatch } from "react-router-dom";
import { Plus } from "lucide-react";
import { navItems } from "./navitems";
import type { NavItemType } from "./navitems";
import LiquidGlassFilter from "./LiquidGlassFilter";

// Order in navItems: Home, Comforts, New post (+ button), Profile
const [home, comforts, , profile] = navItems;

function NavItem({ to, label, icon: Icon, badge }: Readonly<NavItemType>) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-2xl px-3.5 py-1.5 text-[0.6875rem] font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#243447] ${
          isActive
            ? "liquid-pill text-[#243447]"
            : "text-[#263746]/55 hover:text-[#263746]"
        }`
      }
    >
      <span className="relative">
        <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#243447] px-1 text-[0.625rem] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </NavLink>
  );
}

export default function BottomNav() {
  const inConversation = useMatch("/comforts/conversations/:conversationId");
  if (inConversation) return null;

  return (
    /* Outer wrapper: thick blur base + soft top border */
    <nav
      aria-label="Primary"
      className="shrink-0 px-3 pb-5 pt-2 lg:hidden"
      style={{
        background:
          "linear-gradient(to top, rgba(255,255,255,0.72), rgba(255,255,255,0.45))",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        borderTop: "1px solid rgba(255,255,255,0.6)",
      }}
    >
      <LiquidGlassFilter />

      {/* Inner pill — extra glass layer for depth */}
      <div
        className="liquid-glass liquid-glass-nav mx-auto flex max-w-md items-center justify-between rounded-[2rem] px-2 py-2"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.08) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow:
            "0 8px 32px rgba(36,52,71,0.14), inset 0 1.5px 2px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(255,255,255,0.4), 0 1px 0 rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.75)",
        }}
      >
        {/* 1. Home */}
        <NavItem {...home} />

        {/* 2. Comforts */}
        <NavItem {...comforts} />

        {/* 3. Create Post — floating dark pill */}
        <Link
          to="/posts/new"
          aria-label="New post"
          className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#243447]"
          style={{
            background: "linear-gradient(160deg, #2f4559 0%, #1a2a38 100%)",
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.18), 0 6px 20px rgba(26,42,56,0.5), 0 2px 6px rgba(26,42,56,0.3)",
            width: "3.25rem",
            height: "3.25rem",
          }}
        >
          <Plus aria-hidden className="h-6 w-6 text-white" strokeWidth={2.25} />
        </Link>

        {/* 4. Profile */}
        <NavItem {...profile} />
      </div>
    </nav>
  );
}
