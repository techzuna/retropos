"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last resort: an error in the root layout itself, which `error.tsx` cannot
 * catch because it lives *inside* that layout. This file replaces the layout
 * entirely, so it has to bring its own `<html>` and `<body>`.
 *
 * Deliberately self-contained and plain. It keeps the Chulho palette (via
 * globals.css) but not the web fonts — those are loaded by the root layout that
 * just failed, and a page whose whole job is "render when nothing else could"
 * should not add another thing that can fail. System fonts are the trade.
 *
 * The only offered action is a full reload, because at this point nothing about
 * the client's state can be trusted, including the router.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <main className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-md border border-line bg-white">
            <div className="dhaka-band" aria-hidden="true" />
            <div className="p-6 sm:p-8">
              <p className="eyebrow">Till stopped</p>
              <h1 className="mt-2 text-2xl font-semibold">RestroReserve couldn&rsquo;t start</h1>
              <p className="mt-2 text-ink-soft">
                Something failed before any screen could load. Reload this device; if it happens
                again, the restaurant&rsquo;s server needs restarting.
              </p>
              <p className="mt-4 border border-line bg-paper px-3 py-2 text-sm">
                No orders or bills are affected — they are stored on the server, not in this
                browser.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={reset} className="btn btn-primary">
                  Reload
                </button>
                <a href="/pos" className="btn btn-secondary">
                  Back to tables
                </a>
              </div>
              {error.digest && (
                <p className="mt-5 text-xs text-ink-soft">
                  {"Reference for the owner: "}
                  <span className="font-mono">{error.digest}</span>
                </p>
              )}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
