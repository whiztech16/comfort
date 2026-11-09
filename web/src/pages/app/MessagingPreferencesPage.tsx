import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck, Users, UserCheck, ShieldOff } from "lucide-react";
import { PrimaryButton } from "../../components/shared/PrimaryButton";
import { useToast } from "../../hooks/useToast";
import {
  getMessagingPreference,
  setMessagingPreference,
} from "../../lib/sampleProfiles";
import type { MessagingPreference } from "../../lib/sampleProfiles";

const options: {
  id: MessagingPreference;
  title: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    id: "everyone",
    title: "Everyone on Comfort",
    desc: "Anyone can send you a supportive Comfort on your posts or profile.",
    icon: Users,
  },
  {
    id: "interacted",
    title: "People I’ve connected with",
    desc: "Only people whose posts you’ve replied to or exchanged Comforts with.",
    icon: UserCheck,
  },
  {
    id: "nobody",
    title: "Pause receiving Comforts",
    desc: "No one can send you new Comforts. Existing conversations remain open.",
    icon: ShieldOff,
  },
];

export default function MessagingPreferencesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<MessagingPreference>(
    getMessagingPreference()
  );

  function handleSave() {
    setMessagingPreference(selected);
    showToast("Messaging preferences saved.");
    navigate("/settings");
  }

  return (
    <div className="space-y-6">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back to Settings
      </Link>

      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Messaging preferences
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Decide who can send you Comforts. You are always in control of your space.
        </p>
      </section>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-brand-deep ${
                isSelected
                  ? "border-[#243447] bg-[#f8fafd] shadow-sm"
                  : "border-black/[0.08] bg-white hover:bg-[#fafbfe]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-[#243447] text-white"
                    : "bg-[#eef1fa] text-[#243447]"
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold text-navy">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-navy/60">
                  {opt.desc}
                </p>
              </div>

              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-[#243447] bg-[#243447] text-white"
                    : "border-black/20 bg-white"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] text-navy/70">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-deep" strokeWidth={1.75} />
        <span>Comforts are always private and never public comments.</span>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        <PrimaryButton onClick={handleSave} className="w-full sm:w-auto">
          Save preferences
        </PrimaryButton>
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

