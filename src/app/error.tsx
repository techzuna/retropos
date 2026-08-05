"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorScreen } from "@/components/ErrorScreen";

/**
 * The route error boundary — anything a page or its data fetch throws.
 *
 * "Try again" comes first and calls `reset()`, which re-renders the segment
 * without a full reload. That is the right first move here because the likely
 * causes are transient on a LAN box: the server was restarting, SQLite was
 * momentarily locked, the Wi-Fi dropped a request. A reload would also work but
 * costs the staff their place.
 *
 * The message is deliberately not `error.message`: in production Next redacts
 * server errors to avoid leaking internals, so it would read as a generic
 * placeholder anyway. The digest is shown instead, which the owner can actually
 * match against the server log.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console so a tablet can be debugged in place;
    // the server already logs its own side.
    console.error("Route error:", error);
  }, [error]);

  return (
    <ErrorScreen
      eyebrow="Something broke"
      title="This screen didn't load"
      message="The till hit an error drawing this page. Trying again usually clears it — the server may have been restarting."
      reference={error.digest}
    >
      <button type="button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
      <Link href="/pos" className="btn btn-secondary">
        Back to tables
      </Link>
    </ErrorScreen>
  );
}
