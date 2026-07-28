"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ token }: { token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/reservations/${token}/cancel`, { method: "POST" }).catch(
      () => null,
    );
    if (res?.ok) {
      router.refresh();
      return;
    }
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    setError(data?.error ?? "Couldn't cancel just now — please try again or call us.");
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-secondary text-sm">
        Cancel this booking
      </button>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">Cancel this booking? The table goes back up for grabs.</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="btn btn-primary text-sm disabled:opacity-40"
        >
          {busy ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="btn btn-secondary text-sm"
        >
          Keep the booking
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-madder-deep">
          {error}
        </p>
      )}
    </div>
  );
}
