import { Link } from "react-router-dom";
import { Mail, MailOpen, Send } from "lucide-react";
import Avatar from "../shared/Avatar";
import { displayName } from "../../lib/sampleComforts";
import type { Comfort } from "../../types/messaging";

function preview(comfort: Comfort) {
  if (comfort.direction === "sent") return comfort.body;
  // Unopened Comforts show a neutral preview, never the message itself
  return comfort.firstOpenedAt === null ? "Sent you a Comfort" : comfort.body;
}

export default function ComfortRow({ comfort }: Readonly<{ comfort: Comfort }>) {
  const sent = comfort.direction === "sent";
  const person = sent ? comfort.to : comfort.from;
  const unread = !sent && comfort.firstOpenedAt === null;
  const name = sent ? `To ${person.displayName ?? "the author"}` : displayName(person);

  let Icon = Mail;
  if (sent) Icon = Send;
  else if (!unread) Icon = MailOpen;

  let status = "";
  if (sent) {
    status = comfort.status === "opened" ? "Opened" : "Delivered";
    if (comfort.appreciation) status += ` · They said “${comfort.appreciation}”`;
  }

  return (
    <li>
      <Link
        to={`/comforts/${comfort.id}`}
        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-[#f4f6fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <Avatar name={person.displayName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={`truncate text-[0.9375rem] ${
                unread ? "font-semibold text-navy" : "font-medium text-navy/85"
              }`}
            >
              {name}
            </p>
            <p className="shrink-0 text-[0.75rem] text-navy/50">{comfort.sentAt}</p>
          </div>
          <p
            className={`truncate text-[0.875rem] ${
              unread ? "text-navy/80" : "text-navy/55"
            }`}
          >
            {preview(comfort)}
          </p>
          {status ? (
            <p className="mt-0.5 truncate text-[0.75rem] text-navy/50">{status}</p>
          ) : null}
        </div>

        <span className="relative shrink-0 text-navy/45">
          <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          {unread ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-deep ring-2 ring-white"
            />
          ) : null}
        </span>

        {unread ? <span className="sr-only">Unread</span> : null}
      </Link>
    </li>
  );
}