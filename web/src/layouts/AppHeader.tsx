import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, Mail, Sparkles, X } from "lucide-react";
import Avatar from "../components/shared/Avatar";
import logo from "../assets/images/comfort-logo.png";
import { currentUser } from "../lib/currentUser";

// --- Sample notifications (replace with real API later) ----------------------
type Notif = {
  id: string;
  kind: "comfort" | "message" | "appreciation";
  from: string;
  snippet: string;
  ago: string;
  read: boolean;
  to?: string;
};

const sampleNotifications: Notif[] = [
  {
    id: "n1",
    kind: "comfort",
    from: "Maya",
    snippet: "Sent you a Comfort on your post about small steps.",
    ago: "2m ago",
    read: false,
    to: "/comforts",
  },
  {
    id: "n2",
    kind: "message",
    from: "Jay",
    snippet: "Started a conversation with you.",
    ago: "1h ago",
    read: false,
    to: "/comforts",
  },
  {
    id: "n3",
    kind: "appreciation",
    from: "Anonymous",
    snippet: "Responded with warmth to your post about gratitude.",
    ago: "3h ago",
    read: true,
    to: "/comforts",
  },
  {
    id: "n4",
    kind: "comfort",
    from: "Zoe",
    snippet: "Sent you a Comfort: Praying for you 💙",
    ago: "1d ago",
    read: true,
    to: "/comforts",
  },
];

const kindMeta: Record<
  Notif["kind"],
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  comfort: { icon: Heart, bg: "bg-[#eef1fa]", color: "text-brand-deep", label: "Comfort received" },
  message: { icon: Mail, bg: "bg-[#f0faf4]", color: "text-emerald-600", label: "New message" },
  appreciation: { icon: Sparkles, bg: "bg-[#fdf6e3]", color: "text-amber-500", label: "Appreciation" },
};

// --- Notification panel -------------------------------------------------------
function NotifPanel({ onClose }: { onClose: () => void }) {
  const unread = sampleNotifications.filter((n) => !n.read).length;

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
        <h2 className="text-[0.9375rem] font-semibold text-navy">
          Notifications
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-brand-deep px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
              {unread} new
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="flex h-7 w-7 items-center justify-center rounded-full text-navy/50 transition hover:bg-[#f1f3fa] hover:text-navy"
        >
          <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* List */}
      <ul className="max-h-80 divide-y divide-black/[0.05] overflow-y-auto">
        {sampleNotifications.length === 0 ? (
          <li className="px-4 py-8 text-center text-[0.875rem] text-navy/50">
            Nothing yet — check back soon 💙
          </li>
        ) : (
          sampleNotifications.map((n) => {
            const { icon: Icon, bg, color } = kindMeta[n.kind];
            return (
              <li key={n.id}>
                <Link
                  to={n.to ?? "/comforts"}
                  onClick={onClose}
                  className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#f8f9fc] ${
                    !n.read ? "bg-[#f4f7ff]" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.875rem] leading-snug text-navy">
                      <span className="font-semibold">{n.from}</span>{" "}
                      {n.snippet}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-navy/45">{n.ago}</p>
                  </div>
                  {!n.read && (
                    <span
                      aria-label="Unread"
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-deep"
                    />
                  )}
                </Link>
              </li>
            );
          })
        )}
      </ul>

      {/* Footer */}
      <div className="border-t border-black/[0.06] px-4 py-2.5">
        <Link
          to="/comforts"
          onClick={onClose}
          className="block text-center text-[0.8125rem] font-medium text-brand-deep transition hover:underline"
        >
          View all Comforts
        </Link>
      </div>
    </div>
  );
}

// --- Header ------------------------------------------------------------------
export default function AppHeader() {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = sampleNotifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!showNotifs) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifs]);

  return (
    <header className="shrink-0 border-b border-black/[0.06] bg-white lg:pl-64">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 lg:max-w-none lg:px-8">
        {/* Mobile: logo */}
        <Link
          to="/home"
          aria-label="Comfort home"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:hidden"
        >
          <img src={logo} alt="Comfort" className="h-6 w-auto brightness-0" />
        </Link>

        {/* Desktop spacer (no search bar) */}
        <span className="hidden lg:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={showNotifs}
              onClick={() => setShowNotifs((v) => !v)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3fa] text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
            >
              <Bell aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-deep"
                />
              )}
            </button>

            {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}
          </div>

          {/* Avatar -> Profile */}
          <Link
            to="/profile"
            aria-label="Your profile"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0 });
              document.querySelector("main")?.scrollTo({ top: 0, left: 0 });
            }}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            <Avatar name={currentUser.name} />
          </Link>
        </div>
      </div>
    </header>
  );
}
