import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import UnlockChatsModal from "../components/messaging/UnlockChatsModal";
import { apiRequest, getUser } from "../lib/api";
import { getLocalKey } from "../lib/chatKeys";

type PromptState = { mode: "setup" | "unlock"; serverPublicKey: string | null };

type ChatKeyApi = {
  ensureChatKey: () => Promise<boolean>;
  promptSetupOnce: () => Promise<void>;
};

const ChatKeyContext = createContext<ChatKeyApi | null>(null);

// Where do we stand: key on this device, key only on the server, or no key at all
async function inspect(): Promise<"ready" | "unknown" | PromptState> {
  const user = getUser();
  if (!user?.onboardingCompleted) return "unknown";

  try {
    if (await getLocalKey(user.id)) return "ready";
  } catch {
    // Storage unavailable: fall through to the server check
  }

  try {
    const res = await apiRequest<{ publicKey: string }>("/api/v1/keys/account");
    const publicKey = res.data?.publicKey;
    return publicKey ? { mode: "unlock", serverPublicKey: publicKey } : "unknown";
  } catch (err: unknown) {
    const status = (err as { status?: number } | null)?.status;
    return status === 404 ? { mode: "setup", serverPublicKey: null } : "unknown";
  }
}

export function ChatKeyProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const waiters = useRef<Array<(ok: boolean) => void>>([]);

  const settle = useCallback((ok: boolean) => {
    setPrompt(null);
    const pending = waiters.current;
    waiters.current = [];
    for (const resolve of pending) resolve(ok);
  }, []);

  const openPrompt = useCallback(
    (state: PromptState) =>
      new Promise<boolean>((resolve) => {
        waiters.current.push(resolve);
        setPrompt(state);
      }),
    [],
  );

  const ensureChatKey = useCallback(async () => {
    const state = await inspect();
    if (state === "ready") return true;
    if (state === "unknown") return false;
    return openPrompt(state);
  }, [openPrompt]);

  const promptSetupOnce = useCallback(async () => {
    const user = getUser();
    if (!user?.onboardingCompleted) return;

    const flag = `comfort_chat_setup_prompted_${user.id}`;
    try {
      if (localStorage.getItem(flag)) return;
    } catch {
      return;
    }

    const state = await inspect();
    if (typeof state === "string" || state.mode !== "setup") return;

    try {
      localStorage.setItem(flag, "1");
    } catch {
      // If we can't remember it, we still show it this once
    }
    await openPrompt(state);
  }, [openPrompt]);

  const api = useMemo(() => ({ ensureChatKey, promptSetupOnce }), [ensureChatKey, promptSetupOnce]);

  return (
    <ChatKeyContext.Provider value={api}>
      {children}
      {prompt ? (
        <UnlockChatsModal
          mode={prompt.mode}
          serverPublicKey={prompt.serverPublicKey}
          onDone={() => settle(true)}
          onDismiss={() => settle(false)}
        />
      ) : null}
    </ChatKeyContext.Provider>
  );
}

export function useChatKey(): ChatKeyApi {
  const ctx = useContext(ChatKeyContext);
  if (!ctx) throw new Error("useChatKey must be used inside ChatKeyProvider");
  return ctx;
}