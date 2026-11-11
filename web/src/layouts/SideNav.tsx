import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";
import logo from "../assets/images/comfort-logo.png";
import { navItems } from "./navitems";
import { logoutApi } from "../lib/api";

export default function SideNav() {
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/[0.06] bg-white px-4 py-6 lg:flex">
      <Link
        to="/home"
        aria-label="Comfort home"
        className="px-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
      >
        <img src={logo} alt="Comfort" className="h-7 w-auto brightness-0" />
      </Link>

      <nav aria-label="Primary" className="mt-9 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const isCreate = to === "/posts/new";

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-2xl px-3 py-3 text-[0.9375rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
                  isActive
                    ? "bg-[#eef1f7] text-navy"
                    : "text-navy/80 hover:bg-[#f4f6fa] hover:text-navy"
                }`
              }
            >
              {isCreate ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-deep text-white">
                  <Icon aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                </span>
              ) : (
                <Icon aria-hidden className="h-6 w-6" strokeWidth={1.5} />
              )}

              <span className="flex-1">{label}</span>

              {badge ? (
                <span className="rounded-lg bg-[#dde7f7] px-2 py-0.5 text-[0.75rem] font-semibold text-navy">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-1 pb-4">
        <button
          type="button"
          onClick={async () => {
            await logoutApi();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-[0.9375rem] font-medium text-navy/70 transition-colors hover:bg-[#fff1f0] hover:text-[#b4443a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          <LogOut aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>

      <div className="px-3">
        <span aria-hidden className="block h-px w-5 bg-navy/25" />
        <p className="mt-3 font-serif text-[0.8125rem] italic leading-snug text-navy/60">
          Kindness.
          <br />
          Connection.
          <br />
          Community.
        </p>
        <Heart aria-hidden className="mt-4 h-3.5 w-3.5 fill-brand text-brand" />
      </div>
    </aside>
  );
}