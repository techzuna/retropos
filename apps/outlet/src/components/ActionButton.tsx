"use client";

import { useRef, useState } from "react";

/**
 * A button that visibly works.
 *
 * On the shop LAN an action returns in milliseconds and none of this matters.
 * On the shared host every write costs about 1.4 seconds, and a control that
 * merely stops responding for that long does not read as "working" — it reads
 * as broken, so the waiter taps it again. Disabling alone is not feedback:
 * something on the control has to move.
 *
 * So: a spinner appears in place, the label can change, and re-entry is
 * blocked by a ref rather than by state — a second tap can land in the same
 * frame as the first, before React has re-rendered with `busy`.
 *
 * Errors are re-thrown after the busy flag clears, so the caller still owns
 * how failure is shown; this component only owns "is it running".
 */
export function ActionButton({
  onAction,
  children,
  busyLabel,
  className = "btn btn-primary",
  disabled,
  title,
  type = "button",
}: {
  onAction: () => Promise<unknown> | unknown;
  children: React.ReactNode;
  /** Shown instead of `children` while running — e.g. "Settling…". */
  busyLabel?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  async function run() {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(true);
    try {
      await onAction();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <button
      type={type}
      title={title}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      onClick={run}
      className={`${className} ${busy ? "cursor-wait" : ""} disabled:opacity-60`}
    >
      <span className="inline-flex items-center gap-2">
        {busy && (
          <span
            aria-hidden="true"
            className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {busy && busyLabel ? busyLabel : children}
      </span>
    </button>
  );
}
