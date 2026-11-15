import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileX, Lock } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import ChatThread from "../../components/messaging/ChatThread";
import SafetyMenu from "../../components/safety/SafetyMenu";
import { EmptyState } from "../../components/shared/States";
import { PrimaryButton, PrimaryLink } from "../../components/shared/PrimaryButton";
import { useChatKey } from "../../context/ChatKeyContext";
import { getUser } from "../../lib/api";
import { blockConversationApi, unblockConversationApi } from "../../lib/blocksApi";
import { getLocalKey } from "../../lib/chatKeys";
import type { StoredKeypair } from "../../lib/chatKeys";
import { MAX_MESSAGE_CHARS, openMessage, sealMessage } from "../../lib/chatCrypto";
import {
  formatChatTime,
  getConversationApi,
  listMessagesApi,
  markReadApi,
  sendMessageApi,
  toPerson,
} from "../../lib/conversationsApi";
import type { ApiConversation, ApiMessage } from "../../lib/conversationsApi";
import type { ChatMessage } from "../../types/messaging";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 30;
const POLL_MS = 8000;
const UNREADABLE = "This message can’t be read on this device.";

type ThreadMessage = ChatMessage & { createdAt: string };
type Status = "loading" | "locked" | "ready" | "notfound" | "failed";

function toThread(
  items: ApiMessage[],
  keys: StoredKeypair,
  conversationId: string,
): Promise<ThreadMessage[]> {
  return Promise.all(
    items.map(async (m) => {
      const body = await openMessage(m, conversationId, keys);
      return {
        id: m.id,
        from: m.isMine ? "me" : "them",
        body: body ?? UNREADABLE,
        sentAt: formatChatTime(m.createdAt),
        createdAt: m.createdAt,
      } as ThreadMessage;
    }),
  );
}

function mergeMessages(current: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

function sendErrorText(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  if (e.status === 429) return "You’re sending messages quickly. Please wait a moment.";
  if (e.status === 403 || e.status === 409) return e.message || "This message couldn’t be sent.";
  return "We couldn’t send that. Please try again.";
}

function ThreadSkeleton() {
  return (
    <output aria-label="Loading messages" className="block flex-1 space-y-3 py-4 motion-safe:animate-pulse">
      <div className="h-10 w-2/3 rounded-2xl bg-[#e8ecf7]" />
      <div className="ml-auto h-10 w-1/2 rounded-2xl bg-[#e8ecf7]" />
      <div className="h-10 w-3/5 rounded-2xl bg-[#e8ecf7]" />
      <div className="ml-auto h-10 w-2/5 rounded-2xl bg-[#e8ecf7]" />
    </output>
  );
}

function BackButton() {
  return (
    <Link
      to="/comforts"
      state={{ tab: "conversations" }}
      aria-label="Back to Comforts"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3fa] text-navy/80 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
    >
      <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}

export default function ConversationPage() {
  const { conversationId = "" } = useParams();
  const { ensureChatKey } = useChatKey();

  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const keysRef = useRef<StoredKeypair | null>(null);
  const messagesRef = useRef<ThreadMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Ask for the chat key, then load and decrypt the conversation
  useEffect(() => {
    if (!UUID_RE.test(conversationId)) {
      setStatus("notfound");
      return;
    }

    let active = true;
    setStatus("loading");
    setConversation(null);
    setMessages([]);
    setSendError(null);

    (async () => {
      const userId = getUser()?.id;
      if (!userId) {
        if (active) setStatus("failed");
        return;
      }
      if (!(await ensureChatKey())) {
        if (active) setStatus("locked");
        return;
      }

      try {
        const keys = await getLocalKey(userId);
        if (!keys) throw new Error("Chat key missing");
        keysRef.current = keys;

        const [conv, page] = await Promise.all([
          getConversationApi(conversationId),
          listMessagesApi(conversationId, PAGE),
        ]);
        const thread = await toThread([...page.items].reverse(), keys, conversationId);
        if (!active) return;

        setConversation(conv);
        setMessages(thread);
        setCursor(page.nextCursor);
        setHasEarlier(page.hasMore);
        setStatus("ready");
        markReadApi(conversationId).catch(() => undefined);
      } catch (err: unknown) {
        if (!active) return;
        setStatus((err as { status?: number } | null)?.status === 404 ? "notfound" : "failed");
      }
    })().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [conversationId, ensureChatKey, attempt]);

  // Check for new messages while the tab is visible
  useEffect(() => {
    if (status !== "ready") return;
    const keys = keysRef.current;
    if (!keys) return;

    let busy = false;
    const timer = window.setInterval(async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const page = await listMessagesApi(conversationId, 20);
        const known = new Set(messagesRef.current.map((m) => m.id));
        const fresh = page.items.filter((m) => !known.has(m.id));
        if (fresh.length > 0) {
          const decoded = await toThread([...fresh].reverse(), keys, conversationId);
          setMessages((prev) => mergeMessages(prev, decoded));
          if (fresh.some((m) => !m.isMine)) markReadApi(conversationId).catch(() => undefined);
        }
      } catch {
        // Try again on the next tick
      } finally {
        busy = false;
      }
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [status, conversationId]);

  async function loadEarlier() {
    const keys = keysRef.current;
    if (!keys || !cursor || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const page = await listMessagesApi(conversationId, PAGE, cursor);
      const older = await toThread([...page.items].reverse(), keys, conversationId);
      setMessages((prev) => mergeMessages(prev, older));
      setCursor(page.nextCursor);
      setHasEarlier(page.hasMore);
    } catch {
      // The button stays so they can try again
    } finally {
      setLoadingEarlier(false);
    }
  }

  // After a block or unblock, reload the conversation so the page matches the server
  async function refreshConversation() {
    try {
      setConversation(await getConversationApi(conversationId));
    } catch {
      // Keep the current view; the next visit will refresh it
    }
  }

  async function handleSend(text: string): Promise<boolean> {
    const keys = keysRef.current;
    const theirKey = conversation?.counterpartPublicKey;
    if (!keys || !theirKey) {
      setSendError("Encryption isn’t ready for this conversation yet.");
      return false;
    }

    setSendError(null);
    try {
      const sealed = await sealMessage({
        text,
        conversationId,
        myPublicKeyB64: keys.publicKeyB64,
        theirPublicKeyB64: theirKey,
      });
      const saved = await sendMessageApi(conversationId, sealed);
      setMessages((prev) =>
        mergeMessages(prev, [
          {
            id: saved.id,
            from: "me",
            body: text,
            sentAt: formatChatTime(saved.createdAt),
            createdAt: saved.createdAt,
          },
        ]),
      );
      return true;
    } catch (err: unknown) {
      setSendError(sendErrorText(err));
      return false;
    }
  }

  if (status === "notfound") {
    return (
      <EmptyState
        icon={FileX}
        title="We couldn’t find that conversation"
        text="It may have been removed."
        action={<PrimaryLink to="/comforts">Back to Comforts</PrimaryLink>}
      />
    );
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={FileX}
        title="We couldn’t load this conversation"
        text="Check your connection and try again."
        action={<PrimaryButton onClick={() => setAttempt((n) => n + 1)}>Try again</PrimaryButton>}
      />
    );
  }

  if (status === "locked") {
    return (
      <EmptyState
        icon={Lock}
        title="Unlock your chats"
        text="Your messages are encrypted. Enter your passphrase to read this conversation."
        action={<PrimaryButton onClick={() => setAttempt((n) => n + 1)}>Unlock chats</PrimaryButton>}
      />
    );
  }

  if (status === "loading" || !conversation) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <header className="mb-2 flex shrink-0 items-center gap-3 border-b border-black/[0.05] pb-3">
          <BackButton />
        </header>
        <ThreadSkeleton />
      </div>
    );
  }

  const person = toPerson(conversation.counterpart);
  const name = person.displayName ?? "Anonymous";
  const blockedByMe = conversation.blockedByMe === true;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="mb-2 flex shrink-0 items-center gap-3 border-b border-black/[0.05] pb-3">
        <BackButton />
        <Avatar name={person.displayName} />
        <p className="min-w-0 flex-1 truncate text-[1rem] font-semibold text-navy">{name}</p>
        <SafetyMenu
          name={person.displayName}
          reportKind="message"
          blocked={blockedByMe}
          onBlock={() => blockConversationApi(conversationId)}
          onUnblock={() => unblockConversationApi(conversationId)}
          onBlockChange={() => {
            refreshConversation().catch(() => undefined);
          }}
        />
      </header>

      <ChatThread
        messages={messages}
        onSend={handleSend}
        error={sendError}
        disabled={conversation.locked}
        disabledNote={
          blockedByMe
            ? "You blocked this person. Unblock them from the menu to chat again."
            : "This conversation is closed."
        }
        maxLength={MAX_MESSAGE_CHARS}
        hasEarlier={hasEarlier}
        loadingEarlier={loadingEarlier}
        onLoadEarlier={() => {
          loadEarlier().catch(() => undefined);
        }}
      />
    </div>
  );
}