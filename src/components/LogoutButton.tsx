"use client";

import { useRouter } from "next/navigation";

/**
 * Ends the shift, not the device pairing: the tablet returns to its own PIN
 * screen so the next person signs straight in.
 */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded px-2.5 py-2 text-sm text-paper/80 hover:bg-madder-deep"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        router.push("/signin");
        router.refresh();
      }}
    >
      End shift
    </button>
  );
}
