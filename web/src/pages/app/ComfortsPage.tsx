import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Lock, Mail, MessagesSquare, Send } from "lucide-react";
import ComfortRow from "../../components/comforts/ComfortRow";
import ConversationRow from "../../components/comforts/ConversationRow";
import { EmptyState } from "../../components/shared/States";
import { ListSkeleton } from "../../components/shared/Skeleton";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import { useChatKey } from "../../context/ChatKeyContext";
import { listReceivedComfortsApi, listSentComfortsApi } from "../../lib/comfortsApi";
import { listConversationsApi, toConversationSummary } from "../../lib/conversationsApi";

const tabs = [
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
  { id: "conversations", label: "Conversations" },
] as const;

type Tab = (typeof tabs)[number]["id"];
type Page<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };

const fetchReceived = (cursor?: string) => listReceivedComfortsApi(20, cursor);
const fetchSent = (cursor?: string) => listSentComfortsApi(20, cursor);
const fetchConversations = async (cursor?: string) => {
  const page = await listConversationsApi(20, cursor);
  return { ...page, items: page.items.map(toConversationSummary) };
};

const secondaryButton =
  "inline-flex h-12 items-center rounded-full bg-[#f1f3fa] px-6 text-[0.9rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-60";

function usePagedList<T extends { id: string }>(fetchPage: (cursor?: string) => Promise<Page<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const page = await fetchPage();
      setItems(page.items);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      // Keep what we have; the button stays so they can try again
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, cursor, hasMore, loadingMore]);

  return { items, loading, loadingMore, failed, hasMore, reload, loadMore };
}

function LoadMore({
  hasMore,
  loading,
  onClick,
}: Readonly<{ hasMore: boolean; loading: boolean; onClick: () => void }>) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-4">
      <button type="button" onClick={onClick} disabled={loading} className={secondaryButton}>
        {loading ? "Loading..." : "Load more"}
      </button>
    </div>
  );
}

function LoadFailed({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <EmptyState
      title="We couldn’t load this list"
      text="Check your connection and try again."
      action={
        <button type="button" onClick={onRetry} className={secondaryButton}>
          Try again
        </button>
      }
    />
  );
}

export default function ComfortsPage() {
  const location = useLocation();
  const startTab = (location.state as { tab?: Tab } | null)?.tab ?? "received";
  const [tab, setTab] = useState<Tab>(startTab);

  const { promptSetupOnce } = useChatKey();

  const received = usePagedList(fetchReceived);
  const sent = usePagedList(fetchSent);
  const conversations = usePagedList(fetchConversations);

  // Offer chat protection once, only if the user has no chat key yet
  useEffect(() => {
    void promptSetupOnce();
  }, [promptSetupOnce]);

  let loading = conversations.loading;
  if (tab === "received") loading = received.loading;
  else if (tab === "sent") loading = sent.loading;

  let panel;
  if (tab === "received") {
    if (received.failed) {
      panel = <LoadFailed onRetry={() => void received.reload()} />;
    } else if (received.items.length > 0) {
      panel = (
        <>
          <ul className="divide-y divide-black/[0.05]">
            {received.items.map((comfort) => (
              <ComfortRow key={comfort.id} comfort={comfort} />
            ))}
          </ul>
          <LoadMore
            hasMore={received.hasMore}
            loading={received.loadingMore}
            onClick={() => void received.loadMore()}
          />
        </>
      );
    } else {
      panel = (
        <EmptyState
          icon={Mail}
          title="No Comforts yet"
          text="Kind messages sent to you will appear here."
        />
      );
    }
  } else if (tab === "sent") {
    if (sent.failed) {
      panel = <LoadFailed onRetry={() => void sent.reload()} />;
    } else if (sent.items.length > 0) {
      panel = (
        <>
          <ul className="divide-y divide-black/[0.05]">
            {sent.items.map((comfort) => (
              <ComfortRow key={comfort.id} comfort={comfort} />
            ))}
          </ul>
          <LoadMore
            hasMore={sent.hasMore}
            loading={sent.loadingMore}
            onClick={() => void sent.loadMore()}
          />
        </>
      );
    } else {
      panel = (
        <EmptyState
          icon={Send}
          title="You haven’t sent a Comfort yet"
          text="Find a post that moves you and send a few kind words."
          action={<PrimaryLink to="/home">Browse posts</PrimaryLink>}
        />
      );
    }
  } else if (conversations.failed) {
    panel = <LoadFailed onRetry={() => void conversations.reload()} />;
  } else if (conversations.items.length > 0) {
    panel = (
      <>
        <ul className="divide-y divide-black/[0.05]">
          {conversations.items.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </ul>
        <LoadMore
          hasMore={conversations.hasMore}
          loading={conversations.loadingMore}
          onClick={() => void conversations.loadMore()}
        />
      </>
    );
  } else {
    panel = (
      <EmptyState
        icon={MessagesSquare}
        title="No conversations yet"
        text="When you reply to a Comfort, your conversation will appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          Comforts
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Kind messages you’ve received and sent.
        </p>
      </section>

      <div
        role="tablist"
        aria-label="Comforts"
        className="grid grid-cols-3 gap-1 rounded-full bg-[#f1f3fa] p-1"
      >
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls="comforts-panel"
              onClick={() => setTab(id)}
              className={`h-10 rounded-full text-[0.8125rem] font-medium transition focus-visible:outline-2 focus-visible:outline-brand-deep ${
                active ? "bg-white text-navy shadow-sm" : "text-navy/65 hover:text-navy"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div id="comforts-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {loading ? <ListSkeleton /> : panel}
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#f1f3fa] p-4">
        <Lock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" strokeWidth={1.75} />
        <div>
          <p className="text-[0.875rem] font-semibold text-navy">Your privacy matters</p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-navy/60">
            Comforts are private and only visible to you and the person you sent them to.
          </p>
        </div>
      </div>
    </div>
  );
}