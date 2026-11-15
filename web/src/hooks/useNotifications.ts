import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import {
  isNotification,
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  unreadCountApi,
} from "../lib/notificationsApi";
import type { ApiNotification } from "../lib/notificationsApi";

const MAX_ITEMS = 20;

export function useNotifications(open: boolean) {
  const { socket, connected } = useSocket();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const syncCount = useCallback(() => {
    unreadCountApi()
      .then(setUnread)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    syncCount();
  }, [connected, syncCount]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    listNotificationsApi(MAX_ITEMS)
      .then((list) => {
        if (active) setItems(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (payload: unknown) => {
      const incoming = (payload as { notification?: unknown } | null)?.notification;
      if (!isNotification(incoming)) return;
      setItems((prev) =>
        prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev].slice(0, MAX_ITEMS),
      );
      setUnread((count) => count + 1);
    };
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [socket]);

  const markRead = useCallback(
    (n: ApiNotification) => {
      if (n.isRead) return;
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      setUnread((count) => Math.max(0, count - 1));
      markNotificationReadApi(n.id).catch(syncCount);
    },
    [syncCount],
  );

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnread(0);
    markAllNotificationsReadApi().catch(syncCount);
  }, [syncCount]);

  return { items, unread, markRead, markAllRead };
}