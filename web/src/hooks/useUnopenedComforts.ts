import { useCallback, useEffect, useState } from "react";
import { apiRequest, getAccessToken } from "../lib/api";

export const COMFORTS_CHANGED = "comforts:changed";

export function useUnopenedComfortCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const res = await apiRequest<{ count: number }>("/api/v1/comforts/unopened-count");
      setCount(res.data?.count ?? 0);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(COMFORTS_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COMFORTS_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return count;
}