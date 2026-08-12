"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "./ActionButton";

/**
 * Ends the shift, not the device pairing: the tablet returns to its own PIN
 * screen so the next person signs straight in.
 *
 * The POST and the navigation that follows take about 1.4s on the shared host,
 * so this shows a spinner throughout — without one the header simply sat there
 * and the button looked dead.
 */
export function LogoutButton() {
  const router = useRouter();
  return (
    <ActionButton
      className="rounded px-2.5 py-2 text-sm text-paper/80 hover:bg-madder-deep"
      busyLabel="Ending…"
      onAction={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        router.push("/signin");
        router.refresh();
        // Hold the spinner until the new screen actually replaces this one;
        // resolving here would flash the button back to "End shift" mid-exit.
        await new Promise((r) => setTimeout(r, 1500));
      }}
    >
      End shift
    </ActionButton>
  );
}
