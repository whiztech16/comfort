import { useState, useRef, useEffect } from "react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, Mail, Sparkles, X } from "lucide-react";
import Avatar from "../components/shared/Avatar";
import logo from "../assets/images/comfort-logo.png";
import { getUser } from "../lib/api";
import { notificationPath } from "../lib/notificationsApi";
import type { ApiNotification, NotificationType } from "../lib/notificationsApi";
import { useNotifications } from "../hooks/useNotifications";

const typeMeta: Record<NotificationType, { icon: ElementType; bg: string; color: string; text: string }> = {
  new_comfort: {
    icon: Heart,
    bg: "bg-[#eef1fa]",
    color: "text-brand-deep",
    text: "You received a new Comfort.",
  },
  new_message: {
    icon: Mail,
    bg: "bg-[#f0faf4]",
    color: "text-emerald-600",
    text: "You have a new message.",
  },
  new_appreciation: {
    icon: Sparkles,
    bg: "bg-[#fdf6e3]",
    color: "text-amber-500",
    text: "Someone appreciated your Comfort.",
  },
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

type NotifPanelProps = Readonly<{
  items: ApiNotification[];
  unread: number;
  onRead: (n: ApiNotification) => void;
  onReadAll: () => void;
  onClose: () => void;
}>;

function NotifPanel({ items, unread, onRead, onReadAll, onClose }: NotifPanelProps) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
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

      <ul className="max-h-80 divide-y divide-black/[0.05] overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-[0.875rem] text-navy/50">
            Nothing yet. Check back soon 💙
          </li>
        ) : (
          items.map((n) => {
            const { icon: Icon, bg, color, text } = typeMeta[n.type];
            return (
              <li key={n.id}>
                <Link
                  to={notificationPath(n)}
                  onClick={() => {
                    onRead(n);
                    onClose();
                  }}
                  className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#f8f9fc] ${
                    n.isRead ? "" : "bg-[#f4f7ff]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.875rem] leading-snug text-navy">{text}</p>
                    <p className="mt-1 text-[0.75rem] text-navy/45">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span
                      role="img"
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

      <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-2.5">
        <button
          type="button"
          onClick={onReadAll}
          disabled={unread === 0}
          className="text-[0.8125rem] font-medium text-navy/60 transition hover:text-navy disabled:opacity-40"
        >
          Mark all as read
        </button>
        <Link
          to="/comforts"
          onClick={onClose}
          className="text-[0.8125rem] font-medium text-brand-deep transition hover:underline"
        >
          View all Comforts
        </Link>
      </div>
    </div>
  );
}

export default function AppHeader() {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { items, unread, markRead, markAllRead } = useNotifications(showNotifs);
  const user = getUser();

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
        <Link
          to="/home"
          aria-label="Comfort home"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:hidden"
        >
          <img src={logo} alt="Comfort" className="h-6 w-auto brightness-0" />
        </Link>

        <span className="hidden lg:block" />

        <div className="flex items-center gap-2">
          <div ref={notifRef} className="relative">
            <button
              type="button"
              aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
              aria-expanded={showNotifs}
              onClick={() => setShowNotifs((v) => !v)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3fa] text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
            >
              <Bell aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unread > 0 && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-deep"
                />
              )}
            </button>

            {showNotifs && (
              <NotifPanel
                items={items}
                unread={unread}
                onRead={markRead}
                onReadAll={markAllRead}
                onClose={() => setShowNotifs(false)}
              />
            )}
          </div>

          <Link
            to="/profile"
            aria-label="Your profile"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0 });
              document.querySelector("main")?.scrollTo({ top: 0, left: 0 });
            }}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            <Avatar name={user?.profile?.displayName ?? ""} />
          </Link>
        </div>
      </div>
    </header>
  );
}