"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TableDiagram } from "@/components/TableDiagram";
import { useDialog } from "@/components/Dialog";
import { messageFor } from "@/lib/fetch-error";

interface TableOption {
  id: string;
  name: string;
  capacity: number;
  zone: string;
  shape: string;
}

interface Row {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  partySize: number;
  /** Display status, so `completed` (derived from a settled order) shows here. */
  status: string;
  notes: string;
  allDay: boolean;
  tableId: string;
  tableName: string;
  tableZone: string;
  tableCapacity: number;
  tableShape: string;
  /** What the host chose: "Dinner", "All day". Snapshotted on the booking. */
  periodLabel: string;
  startLabel: string;
  endLabel: string;
  overdue: boolean;
  orderId: string | null;
}

interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

/** Sentinel for the whole-day option in the period picker. */
const ALL_DAY = "all-day";

const STATUS: Record<string, { label: string; chip: string }> = {
  incoming: { label: "Incoming", chip: "border-brass bg-brass/10 text-brass" },
  confirmed: { label: "Confirmed", chip: "border-leaf bg-leaf/10 text-leaf" },
  seated: { label: "Seated", chip: "border-madder bg-madder/10 text-madder-deep" },
  completed: { label: "Completed", chip: "border-line bg-paper-deep text-ink-soft" },
  cancelled: { label: "Cancelled", chip: "border-line bg-paper text-ink-soft" },
  no_show: { label: "No-show", chip: "border-line bg-paper text-ink-soft" },
};

export function ReservationManager({
  date,
  today,
  prevDate,
  nextDate,
  tables,
  periods,
  canEditPeriods,
  timezone,
  rows,
}: {
  date: string;
  today: string;
  prevDate: string;
  nextDate: string;
  tables: TableOption[];
  periods: Period[];
  canEditPeriods: boolean;
  timezone: string;
  zoneSuggestions: string[];
  rows: Row[];
}) {
  const router = useRouter();
  const { ask, confirm, dialog } = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(rows.length === 0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingPeriods, setEditingPeriods] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ name: "", startTime: "", endTime: "" });
  const activePeriods = periods.filter((p) => p.active);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    partySize: "2",
    tableId: "",
    // Default to the last period of the day — dinner is what most calls are for.
    period: activePeriods.at(-1)?.id ?? ALL_DAY,
    needsConfirmation: false,
    notes: "",
  });

  const party = Number(form.partySize) || 1;
  const live = rows.filter((r) => !["cancelled", "no_show"].includes(r.status));
  const closed = rows.filter((r) => ["cancelled", "no_show"].includes(r.status));

  async function call(url: string, method: string, body?: unknown) {
    if (busy) return null;
    setBusy(true);
    setError(null);
    setMenuOpen(null);
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (!res?.ok) setError(messageFor(res, data));
    setBusy(false);
    router.refresh();
    return res?.ok ? data : null;
  }

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError("Whose booking is it? A name is how staff greet them.");
      return;
    }
    if (!form.tableId) {
      setError("Pick a table for them.");
      return;
    }
    const allDay = form.period === ALL_DAY;
    const ok = await call("/api/reservations", "POST", {
      tableId: form.tableId,
      customerName: form.customerName.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      partySize: party,
      date,
      allDay: allDay || undefined,
      servicePeriodId: allDay ? undefined : form.period,
      needsConfirmation: form.needsConfirmation || undefined,
      notes: form.notes.trim() || undefined,
    });
    if (ok) {
      // Keep the period and table: a host taking several calls books the same
      // service repeatedly, and re-picking Dinner every time is the annoying part.
      setForm((f) => ({ ...f, customerName: "", phone: "", email: "", notes: "" }));
      setAdding(false);
    }
  }

  async function seat(row: Row) {
    const data = await call(`/api/reservations/${row.id}/seat`, "POST");
    if (data?.orderId) router.push(`/pos/tables/${row.tableId}`);
  }

  /**
   * One booking as a single line under its table: which service, who, what
   * state, and the one action that state calls for. Everything rarer — moving
   * the period, no-show, cancel — lives behind the `⋮`, so the common case is
   * one tap and the row stays scannable.
   */
  function bookingLine(row: Row) {
    const chip = STATUS[row.status] ?? STATUS.confirmed;
    const detail = [row.phone, row.email, row.notes].filter(Boolean).join(" · ");
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="w-20 shrink-0">
          <span className="block text-sm font-medium leading-tight">{row.periodLabel}</span>
          {!row.allDay && (
            <span className="block font-mono text-xs text-ink-soft">
              {`${row.startLabel}–${row.endLabel}`}
            </span>
          )}
        </span>

        {/*
          A minimum width, not `min-w-0`: with the row free to shrink the name
          collapsed to "Sh…" on a phone while the chip and buttons kept their
          size. The name is the thing a host reads, so the controls wrap to the
          next line instead.
        */}
        <span className="min-w-28 flex-1">
          <span className="block truncate font-medium">
            {`${row.customerName} · ${row.partySize}p`}
          </span>
          {detail && <span className="block truncate text-xs text-ink-soft">{detail}</span>}
        </span>

        <span
          className={`shrink-0 border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            row.overdue ? "border-madder bg-madder/10 text-madder-deep" : chip.chip
          }`}
        >
          {row.overdue ? "Overdue" : chip.label}
        </span>

        {row.status === "incoming" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void call(`/api/reservations/${row.id}/confirm`, "POST")}
            className="btn btn-primary shrink-0 px-2.5 py-1.5 text-sm disabled:opacity-40"
          >
            Confirm
          </button>
        )}
        {row.status === "confirmed" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void seat(row)}
            className="btn btn-secondary shrink-0 px-2.5 py-1.5 text-sm disabled:opacity-40"
          >
            Seat
          </button>
        )}
        {row.status === "seated" && (
          <Link
            href={`/pos/tables/${row.tableId}`}
            className="btn btn-secondary shrink-0 px-2.5 py-1.5 text-sm"
          >
            Open order
          </Link>
        )}
        {row.status === "completed" && (
          <Link
            href={row.orderId ? `/pos/bill/${row.orderId}` : "#"}
            className="btn shrink-0 px-2.5 py-1.5 text-sm"
          >
            Bill
          </Link>
        )}

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={`More actions for ${row.customerName}`}
            onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}
            className="px-2 text-lg leading-none text-ink-soft"
          >
            ⋮
          </button>
          {menuOpen === row.id && (
            <div className="absolute right-0 z-10 mt-1 w-44 border border-line bg-white text-sm shadow-lg">
              {row.status === "incoming" || row.status === "confirmed" ? (
                <>
                  <label className="block px-3 py-2 hover:bg-paper">
                    <span className="block text-xs text-ink-soft">Move to</span>
                    <select
                      value=""
                      onChange={(e) => movePeriod(row, e.target.value)}
                      className="mt-1 w-full border border-line bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Choose…</option>
                      {activePeriods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      <option value={ALL_DAY}>All day</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `${row.customerName} didn't arrive?`,
                          message: "Marks a no-show and frees the table for rebooking.",
                          confirmLabel: "No-show",
                        })
                      ) {
                        void call(`/api/reservations/${row.id}/no-show`, "POST");
                      }
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-paper"
                  >
                    No-show
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Cancel ${row.customerName}'s booking?`,
                          message: "The table is freed; the booking stays on the day's record.",
                          confirmLabel: "Cancel booking",
                          danger: true,
                        })
                      ) {
                        void call(`/api/reservations/${row.id}`, "DELETE");
                      }
                    }}
                    className="block w-full px-3 py-2 text-left text-madder-deep hover:bg-paper"
                  >
                    Cancel booking
                  </button>
                </>
              ) : (
                <Link href={`/pos/tables/${row.tableId}`} className="block px-3 py-2 hover:bg-paper">
                  Open the table
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /** Move a booking to another period (or all day) — never to a raw time. */
  function movePeriod(row: Row, value: string) {
    if (!value) return;
    void call(`/api/reservations/${row.id}`, "PATCH", {
      date,
      ...(value === ALL_DAY ? { allDay: true } : { servicePeriodId: value, allDay: false }),
    });
  }

  return (
    <div className="pt-6">
      {/*
        Two hosts can be taking calls at once, so this screen has to notice a
        booking made on another device without anyone reloading. Paused while a
        manager edits service times, for the same reason the floor plan pauses:
        a refresh landing mid-edit throws the edit away.
      */}
      {!editingPeriods && <AutoRefresh seconds={15} />}
      {dialog}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Title takes its own row on a phone, so the day controls stay one group
            instead of stranding the "next day" arrow on a line of its own. */}
        <h1 className="basis-full font-display text-2xl sm:basis-auto">Bookings</h1>
        <span className="hidden flex-1 sm:block" />
        <Link href={`/pos/reservations?date=${prevDate}`} className="btn text-sm" aria-label="Previous day">
          ←
        </Link>
        <input
          type="date"
          value={date}
          onChange={(e) => router.push(`/pos/reservations?date=${e.target.value}`)}
          className="border border-line bg-white px-2 py-2 text-sm"
        />
        <Link href={`/pos/reservations?date=${nextDate}`} className="btn text-sm" aria-label="Next day">
          →
        </Link>
        {date !== today && (
          <Link href="/pos/reservations" className="btn text-sm">
            Today
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {`${date === today ? "Today" : date} · ${live.length} live, ${closed.length} closed`}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep"
        >
          {error}
        </p>
      )}

      {/* Taking a booking: the form, or the button that reveals it. */}
      {adding ? (
        <form onSubmit={book} className="border border-line bg-white p-4 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg">{`New booking · ${date}`}</p>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-sm text-ink-soft underline underline-offset-4"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium">Name</span>
              <input
                type="text"
                maxLength={100}
                placeholder="Sharma"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Guests</span>
              <input
                type="number"
                min={1}
                max={200}
                inputMode="numeric"
                value={form.partySize}
                onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                className="mt-1 w-24 border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">
                Phone <span className="font-normal text-ink-soft">— optional</span>
              </span>
              <input
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">
                Email <span className="font-normal text-ink-soft">— optional</span>
              </span>
              <input
                type="email"
                maxLength={200}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium">Table</span>
              <select
                value={form.tableId}
                onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              >
                <option value="">Pick a table…</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.capacity < party}>
                    {`${t.name} · ${t.capacity} seats${t.zone ? ` · ${t.zone}` : ""}${
                      t.capacity < party ? " — too small" : ""
                    }`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Coming for</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {activePeriods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, period: p.id })}
                  aria-pressed={form.period === p.id}
                  className={`border px-3 py-2 text-sm ${
                    form.period === p.id ? "border-madder bg-madder text-paper" : "border-line bg-white"
                  }`}
                >
                  {p.name}
                  <span className="ml-1.5 font-mono text-xs opacity-70">
                    {`${p.startTime}–${p.endTime}`}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, period: ALL_DAY })}
                aria-pressed={form.period === ALL_DAY}
                className={`border px-3 py-2 text-sm ${
                  form.period === ALL_DAY ? "border-madder bg-madder text-paper" : "border-line bg-white"
                }`}
              >
                All day
              </button>
            </div>
            {activePeriods.length === 0 && (
              <p className="mt-2 text-sm text-ink-soft">
                No service periods set up — bookings can only be held all day until a manager adds
                some below.
              </p>
            )}
          </fieldset>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.needsConfirmation}
                onChange={(e) => setForm({ ...form, needsConfirmation: e.target.checked })}
                className="size-4"
              />
              <span className="text-sm font-medium">
                Not confirmed yet
                <span className="font-normal text-ink-soft">{" — they'll ring back"}</span>
              </span>
            </label>
          </div>

          <label className="mt-3 block">
            <span className="block text-sm font-medium">
              Note{" "}
              <span className="font-normal text-ink-soft">
                — birthday, window seat, arriving late…
              </span>
            </span>
            <input
              type="text"
              maxLength={300}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full border border-line bg-white px-3 py-2.5"
            />
          </label>

          <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-40">
            {busy ? "Booking…" : "Book the table"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-primary mt-4">
          + New booking
        </button>
      )}

      {/*
        The day laid out **by table**, with each table's booked service times
        beneath it (owner's call, 2026-07-29). A host on the phone asks "is T4
        free for dinner?", and a flat list of bookings sorted by time can't
        answer that without scanning every card. Every active table is listed —
        the empty ones are the answer to that question as often as the full ones.
      */}
      <ul className="mt-5 space-y-3">
        {tables.map((t) => {
          const forTable = live.filter((r) => r.tableId === t.id);
          const busyNow = forTable.some((r) => r.status === "seated" || r.status === "completed");
          return (
            <li key={t.id} className="border border-line bg-white">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <TableDiagram
                  shape={t.shape}
                  capacity={t.capacity}
                  className={`size-10 shrink-0 ${
                    busyNow ? "text-madder" : forTable.length ? "text-brass" : "text-leaf"
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">{t.name}</p>
                  <p className="text-xs text-ink-soft">
                    {`${t.capacity} seats${t.zone ? ` · ${t.zone}` : ""}`}
                  </p>
                </div>
                <span className="hidden flex-1 sm:block" />
                <span className="text-sm text-ink-soft">
                  {forTable.length === 0
                    ? "Free all day"
                    : `${forTable.length} booked`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, tableId: t.id }));
                    setAdding(true);
                  }}
                  className="btn px-2.5 py-1.5 text-sm"
                >
                  Book
                </button>
              </div>

              {forTable.length > 0 && (
                <ul className="divide-y divide-line border-t border-line">
                  {forTable.map((row) => (
                    <li key={row.id} className="px-3 py-2">
                      {bookingLine(row)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {tables.length === 0 && (
        <p className="mt-6 text-ink-soft">
          No tables set up yet — a manager can add them from the Tables screen.
        </p>
      )}

      {/*
        Service times live here rather than on a settings page: they exist only
        to be picked when taking a booking, so the screen that takes bookings is
        where a manager notices they're wrong. Same toggle pattern as the floor
        plan on /pos — staff never see it, and the writes are manager-gated.
      */}
      {canEditPeriods && (
        <section className="mt-8 border border-line bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl">Service times</h2>
            <button
              type="button"
              onClick={() => setEditingPeriods((v) => !v)}
              aria-pressed={editingPeriods}
              className={`btn text-sm ${editingPeriods ? "btn-primary" : ""}`}
            >
              {editingPeriods ? "Done" : "Edit service times"}
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {`What a host can book a table for. Times are ${timezone} wall clock — change the outlet's timezone under Admin. Retiming a period leaves bookings already taken exactly where they are.`}
          </p>

          <ul className="mt-3 divide-y divide-line border border-line">
            {periods.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                <span className={`font-medium ${p.active ? "" : "text-ink-soft line-through"}`}>
                  {p.name}
                </span>
                <span className="font-mono text-sm text-ink-soft">
                  {`${p.startTime}–${p.endTime}`}
                </span>
                {!p.active && <span className="text-xs uppercase text-ink-soft">retired</span>}
                <span className="flex-1" />
                {editingPeriods && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      className="btn px-2 py-1 text-xs"
                      onClick={async () => {
                        const v = await ask({
                          title: `Rename ${p.name}`,
                          fields: [{ name: "name", label: "Period name", value: p.name, maxLength: 100 }],
                        });
                        const name = v?.name.trim();
                        if (!name || name === p.name) return;
                        void call(`/api/settings/service-periods/${p.id}`, "PATCH", { name });
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="btn px-2 py-1 text-xs"
                      onClick={async () => {
                        const v = await ask({
                          title: `${p.name} hours`,
                          message: `Wall clock in ${timezone}. Bookings already taken don't move.`,
                          fields: [
                            { name: "startTime", label: "From", value: p.startTime, type: "time" },
                            { name: "endTime", label: "To", value: p.endTime, type: "time" },
                          ],
                        });
                        if (!v?.startTime || !v.endTime) return;
                        void call(`/api/settings/service-periods/${p.id}`, "PATCH", {
                          startTime: v.startTime,
                          endTime: v.endTime,
                        });
                      }}
                    >
                      Times
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="btn px-2 py-1 text-xs"
                      onClick={() =>
                        void call(`/api/settings/service-periods/${p.id}`, "PATCH", {
                          active: !p.active,
                        })
                      }
                    >
                      {p.active ? "Retire" : "Restore"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Delete ${p.name}`}
                      className="px-1 text-madder-deep"
                      onClick={async () => {
                        if (
                          await confirm({
                            title: `Delete ${p.name}?`,
                            message: "Only possible if nothing has ever been booked for it.",
                            confirmLabel: "Delete",
                            danger: true,
                          })
                        )
                          void call(`/api/settings/service-periods/${p.id}`, "DELETE");
                      }}
                    >
                      ×
                    </button>
                  </>
                )}
              </li>
            ))}
            {periods.length === 0 && (
              <li className="px-3 py-3 text-sm text-ink-soft">
                No service periods yet — add Lunch and Dinner below.
              </li>
            )}
          </ul>

          {editingPeriods && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="block text-sm font-medium">Name</span>
                <input
                  placeholder="High tea"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  className="mt-1 w-40 border border-line px-3 py-2.5"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium">From</span>
                <input
                  type="time"
                  value={newPeriod.startTime}
                  onChange={(e) => setNewPeriod({ ...newPeriod, startTime: e.target.value })}
                  className="mt-1 border border-line px-3 py-2.5"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium">To</span>
                <input
                  type="time"
                  value={newPeriod.endTime}
                  onChange={(e) => setNewPeriod({ ...newPeriod, endTime: e.target.value })}
                  className="mt-1 border border-line px-3 py-2.5"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                className="btn btn-secondary disabled:opacity-40"
                onClick={async () => {
                  if (!newPeriod.name.trim() || !newPeriod.startTime || !newPeriod.endTime) {
                    setError("Give the period a name and a start and end time.");
                    return;
                  }
                  const ok = await call("/api/settings/service-periods", "POST", {
                    name: newPeriod.name.trim(),
                    startTime: newPeriod.startTime,
                    endTime: newPeriod.endTime,
                    sortOrder: periods.length + 1,
                  });
                  if (ok) setNewPeriod({ name: "", startTime: "", endTime: "" });
                }}
              >
                Add period
              </button>
            </div>
          )}
        </section>
      )}

      {closed.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow">Closed</h2>
          <ul className="mt-2 divide-y divide-line border border-line bg-white text-sm text-ink-soft">
            {closed.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 px-3 py-2">
                <span>{row.periodLabel}</span>
                <span className="line-through">{row.customerName}</span>
                <span>{`${row.partySize} · ${row.tableName}`}</span>
                <span className="flex-1" />
                <span className="text-xs uppercase">{STATUS[row.status]?.label ?? row.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
