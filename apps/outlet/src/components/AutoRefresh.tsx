"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the current server component tree every `seconds`, but only while
 * someone is actually looking at it.
 *
 * Every refresh is a full server round trip — each page is `force-dynamic`,
 * because it has to ask the database who is signed in before it can render.
 * That is cheap on the shop LAN and expensive on shared hosting, where a
 * single request was measured at ~1.3s of server time. A tablet left face-down
 * on the pass otherwise polls all evening for nobody.
 *
 * Refreshing once on becoming visible again matters as much as pausing: the
 * board a waiter comes back to is current, rather than however stale it was
 * when the screen locked.
 */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      timer ??= setInterval(() => router.refresh(), seconds * 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [router, seconds]);

  return null;
}
