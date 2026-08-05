"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { failureMessage } from "@/lib/fetch-error";

interface Hold {
  id: string;
  customerName: string;
  partySize: number;
  /** "Dinner", "All day" — what the host booked, not a clock time. */
  periodLabel: string;
  allDay: boolean;
  startLabel: string;
  endLabel: string;
  /** True once the window has started; false while it's still upcoming. */
  active: boolean;
}

export function SeatForm({
  tableId,
  tableName,
  capacity,
  hold,
}: {
  tableId: string;
  tableName: string;
  capacity: number;
  hold?: Hold | null;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // With a booking on the table the one-tap path is "seat them"; the manual form
  // stays one tap away for the walk-in case. Never blocked — the host decides
  // who sits down, not the database.
  const [manual, setManual] = useState(!hold);

  async function post(url: string, body?: unknown) {
    if (busy) return false;
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    if (res?.ok) {
      router.refresh();
      return true;
    }
    setBusy(false);
    setError(await failureMessage(res));
    if (res?.status === 409) router.refresh(); // someone else just seated it
    return false;
  }

  return (
    <div className="mx-auto max-w-sm pt-8">
      <p className="text-sm">
        <Link href="/pos" className="text-ink-soft underline underline-offset-4">
          ← Tables
        </Link>
      </p>
      <h1 className="mt-3 font-display text-2xl">
        {`Seat ${tableName} `}
        <span className="text-base text-ink-soft">{`(up to ${capacity})`}</span>
      </h1>

      {hold && (
        <div className="mt-5 border border-brass bg-brass/10 p-4">
          <p className="eyebrow">{hold.active ? "Table taken · reserved now" : "Reserved shortly"}</p>
          <p className="mt-1 font-display text-xl">{hold.customerName}</p>
          <p className="mt-0.5 text-sm">
            {hold.allDay
              ? `${hold.partySize} ${hold.partySize === 1 ? "guest" : "guests"} · ${hold.periodLabel}`
              : `${hold.partySize} ${hold.partySize === 1 ? "guest" : "guests"} · ${hold.periodLabel} · ${hold.startLabel}–${hold.endLabel}`}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post(`/api/reservations/${hold.id}/seat`)}
            className="btn btn-primary mt-3 w-full disabled:opacity-40"
          >
            {busy ? "Seating…" : `Seat ${hold.customerName}`}
          </button>
          {!manual && (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-2 w-full text-sm text-ink-soft underline underline-offset-4"
            >
              Someone else is taking this table
            </button>
          )}
        </div>
      )}

      {manual && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void post("/api/orders", {
              tableId,
              customerName: customerName.trim() || undefined,
              guestCount: guestCount ? Number(guestCount) : undefined,
            });
          }}
          className="mt-6 space-y-4"
        >
          {hold && (
            <p className="border border-line bg-paper px-3 py-2 text-sm">
              {`${hold.customerName}'s booking stays open — mark it a no-show or move it from Bookings if they don't arrive.`}
            </p>
          )}
          <label className="block">
            <span className="block text-sm font-medium">
              Customer name <span className="font-normal text-ink-soft">— optional</span>
            </span>
            <input
              type="text"
              maxLength={100}
              placeholder="Anonymous Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full border border-line bg-white px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium">
              Guests <span className="font-normal text-ink-soft">— optional, feeds reports</span>
            </span>
            <input
              type="number"
              min={1}
              max={200}
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="mt-1 w-24 border border-line bg-white px-3 py-2.5"
            />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-40">
            {busy ? "Seating…" : hold ? "Seat a walk-in instead" : "Seat & start order"}
          </button>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep"
        >
          {error}
        </p>
      )}
    </div>
  );
}
