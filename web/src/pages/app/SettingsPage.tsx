import { useState } from "react";
import { Bell, Lock, User, ChevronRight, Heart } from "lucide-react";

// ─── sample notification data (replace with real API data later) ───────────
const sampleLikeNotifications = [
  { id: "n1", liker: "Maya", postSnippet: "You are doing better than you think…", ago: "2h ago" },
  { id: "n2", liker: "Jay", postSnippet: "I finally took that step I've been overthinking…", ago: "5h ago" },
  { id: "n3", liker: "Anonymous", postSnippet: "The Lord is close to the brokenhearted…", ago: "1d ago" },
];

// ─── reusable section wrapper ────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[0.75rem] font-semibold uppercase tracking-wider text-navy/40">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        {children}
      </div>
    </section>
  );
}

// ─── single row inside a section ─────────────────────────────────────────────
function Row({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f8f9fc] focus-visible:outline-2 focus-visible:outline-brand-deep [&:not(:last-child)]:border-b [&:not(:last-child)]:border-black/[0.05]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1fa] text-brand-deep">
        <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-[0.9375rem] font-medium text-navy">{label}</span>
        {sub && <span className="block text-[0.8125rem] text-navy/50">{sub}</span>}
      </span>
      <ChevronRight aria-hidden className="h-4 w-4 text-navy/30" strokeWidth={1.75} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<"settings" | "likes">("settings");

  return (
    <div className="space-y-6">
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-navy">
        {tab === "likes" ? "Who liked your posts" : "Settings"}
      </h1>

      {tab === "likes" ? (
        /* ── Like notifications ── */
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setTab("settings")}
            className="mb-2 text-[0.875rem] font-medium text-brand-deep hover:underline"
          >
            ← Back to Settings
          </button>

          {sampleLikeNotifications.length === 0 ? (
            <p className="rounded-2xl border border-black/[0.06] p-6 text-center text-[0.9rem] text-navy/50">
              No likes yet — your posts will get there! 💙
            </p>
          ) : (
            <ul className="space-y-2">
              {sampleLikeNotifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f3]">
                    <Heart
                      aria-hidden
                      className="h-4 w-4 fill-[#b4443a] text-[#b4443a]"
                      strokeWidth={1.75}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9rem] font-medium text-navy">
                      <span className="font-semibold">{n.liker}</span> liked your post
                    </p>
                    <p className="mt-0.5 truncate text-[0.8125rem] text-navy/50">
                      "{n.postSnippet}"
                    </p>
                    <p className="mt-1 text-[0.75rem] text-navy/40">{n.ago}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* ── Settings list ── */
        <div className="space-y-5">
          <Section title="Notifications">
            <Row
              icon={Heart}
              label="Post likes"
              sub="See who liked your posts"
              onClick={() => setTab("likes")}
            />
            <Row
              icon={Bell}
              label="Push notifications"
              sub="Comments, messages & more"
            />
          </Section>

          <Section title="Account">
            <Row icon={User} label="Edit profile" sub="Name, photo, bio" />
            <Row icon={Lock} label="Privacy & safety" sub="Who can find and message you" />
          </Section>
        </div>
      )}
    </div>
  );
}

