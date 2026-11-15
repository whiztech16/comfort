import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, UserX, ShieldCheck } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import { EmptyState } from "../../components/shared/States";
import { useToast } from "../../hooks/useToast";
import { listBlocksApi, unblockApi } from "../../lib/blocksApi";
import type { ApiBlock } from "../../lib/blocksApi";

export default function BlockedUsersPage() {
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState<ApiBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    listBlocksApi()
      .then(setBlocks)
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnblock(blockId: string, name: string) {
    setUnblocking(blockId);
    try {
      await unblockApi(blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      showToast(`Unblocked ${name}.`);
    } catch (err: unknown) {
      const message = (err as { message?: string } | null)?.message;
      showToast(message || "Failed to unblock.");
    } finally {
      setUnblocking(null);
    }
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
          Blocked users
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Blocked accounts cannot send you Comforts or view your profile.
        </p>
      </section>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-deep" />
        </div>
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No blocked users"
          text="When you block someone, they will appear here. You can unblock them anytime."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          <ul className="divide-y divide-black/[0.05]">
            {blocks.map((block) => {
              const { displayName, username, isAnonymous } = block.user;
              return (
                <li
                  key={block.id}
                  className="flex items-center justify-between gap-3 p-4 transition hover:bg-[#fafbfe]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={isAnonymous ? null : displayName} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.9375rem] font-semibold text-navy">{displayName}</p>
                      {username ? <p className="text-[0.75rem] text-navy/50">@{username}</p> : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleUnblock(block.id, displayName).catch(() => undefined);
                    }}
                    disabled={unblocking === block.id}
                    className="rounded-full border border-black/[0.12] bg-white px-4 py-1.5 text-[0.8125rem] font-medium text-navy transition hover:bg-[#f1f3fa] focus-visible:outline-2 focus-visible:outline-brand-deep disabled:opacity-50"
                  >
                    {unblocking === block.id ? "Unblocking…" : "Unblock"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] text-navy/70">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-deep" strokeWidth={1.75} />
        <span>Blocking is confidential. We never notify someone when you block them.</span>
      </div>
    </div>
  );
}