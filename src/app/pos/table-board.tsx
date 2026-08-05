"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TableDiagram } from "@/components/TableDiagram";
import { useDialog } from "@/components/Dialog";
import { failureMessage } from "@/lib/fetch-error";

export interface BoardTile {
  id: string;
  name: string;
  capacity: number;
  zone: string;
  shape: string;
  active: boolean;
  /** Has orders or bookings — can be retired but never deleted. */
  hasHistory: boolean;
  order: {
    customerName: string;
    price: string;
    itemCount: number;
    minutes: number;
    holdNote: string | null;
  } | null;
  hold: {
    customerName: string;
    line: string;
    /** The window covers right now, so the table is taken, not merely booked. */
    live: boolean;
  } | null;
}

const UNZONED = "Unzoned";
const SHAPE_LABEL: Record<string, string> = { rect: "Long", square: "Square", round: "Round" };

/**
 * The staff home screen, and — for a manager — the floor plan itself.
 *
 * These were two screens until the owner pointed out they're one thing: the
 * board already draws every table in its zone, so editing the room somewhere
 * else meant maintaining the same layout twice. Editing hides behind a toggle
 * so a waiter mid-service never meets a Rename button, and the server enforces
 * manager+ on every write regardless of what the UI offers.
 */
export function TableBoard({
  tiles,
  canEdit,
  zoneSuggestions,
  shapes,
}: {
  tiles: BoardTile[];
  canEdit: boolean;
  zoneSuggestions: string[];
  shapes: string[];
}) {
  const router = useRouter();
  const { ask, confirm, dialog } = useDialog();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", capacity: "2", zone: "", shape: "rect" });

  const live = tiles.filter((t) => t.active);
  const retired = tiles.filter((t) => !t.active);
  // A live hold counts as taken: the point of the change is that the board's
  // "free" number never includes a table a booked party is due at right now.
  const taken = live.filter((t) => t.order || t.hold?.live).length;
  const upcoming = live.filter((t) => !t.order && t.hold && !t.hold.live).length;

  // Zones already in use come first: after the first few tables a manager is
  // almost always reusing a zone, not inventing one.
  const zoneOptions = useMemo(
    () => [...new Set([...tiles.map((t) => t.zone).filter(Boolean), ...zoneSuggestions])],
    [tiles, zoneSuggestions],
  );

  const groups = useMemo(() => {
    const byZone = new Map<string, BoardTile[]>();
    for (const t of tiles.filter((x) => x.active)) {
      const key = t.zone || UNZONED;
      byZone.set(key, [...(byZone.get(key) ?? []), t]);
    }
    return [...byZone.entries()].sort(([a], [b]) =>
      a === UNZONED ? 1 : b === UNZONED ? -1 : a.localeCompare(b),
    );
  }, [tiles]);

  async function call(url: string, method: string, body?: unknown) {
    if (busy) return false;
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    const ok = Boolean(res?.ok);
    if (!ok) setError(await failureMessage(res));
    setBusy(false);
    router.refresh();
    return ok;
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    const capacity = Number(draft.capacity);
    if (!draft.name.trim() || !Number.isInteger(capacity) || capacity < 1) {
      setError("Give the table a name and a seat count of at least 1.");
      return;
    }
    const ok = await call("/api/tables", "POST", {
      name: draft.name.trim(),
      capacity,
      zone: draft.zone.trim() || undefined,
      shape: draft.shape,
    });
    // Keep zone, seats and shape: adding "C1, C2, C3" to one zone is the common run.
    if (ok) setDraft((d) => ({ ...d, name: "" }));
  }

  /** One dialog for the whole table: fewer taps than four separate prompts. */
  async function editTable(t: BoardTile) {
    const v = await ask({
      title: `Edit ${t.name}`,
      fields: [
        { name: "name", label: "Name", value: t.name, maxLength: 100 },
        { name: "capacity", label: "Seats", value: String(t.capacity), type: "number", min: 1, max: 50 },
        {
          name: "zone",
          label: "Zone",
          value: t.zone,
          maxLength: 60,
          placeholder: "Courtyard",
          options: zoneOptions,
          hint: "Leave blank for unzoned.",
        },
      ],
      submitLabel: "Save table",
    });
    if (!v) return;
    const name = v.name.trim();
    const capacity = Number(v.capacity);
    if (!name) {
      setError("A table needs a name.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Seats must be a whole number, 1 or more.");
      return;
    }
    void call(`/api/tables/${t.id}`, "PATCH", { name, capacity, zone: v.zone.trim() });
  }

  function cycleShape(t: BoardTile) {
    // Three options — cycling is one tap where a prompt would be three.
    const next = shapes[(shapes.indexOf(t.shape) + 1) % shapes.length];
    void call(`/api/tables/${t.id}`, "PATCH", { shape: next });
  }

  async function remove(t: BoardTile) {
    if (t.hasHistory) {
      const ok = await confirm({
        title: `Retire ${t.name}?`,
        message: "It leaves the board but keeps its past bills and bookings.",
        confirmLabel: "Retire",
      });
      if (ok) void call(`/api/tables/${t.id}`, "PATCH", { active: false });
      return;
    }
    const ok = await confirm({
      title: `Delete ${t.name}?`,
      message: "It has no history, so this removes it for good.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) void call(`/api/tables/${t.id}`, "DELETE");
  }

  /**
   * A hold whose window covers *now* reads as taken, in the same treatment as an
   * open order (owner's call): nobody should walk a party onto a held table
   * because the tile looked free. A hold that is merely upcoming stays brass.
   */
  function tileClass(t: BoardTile) {
    if (editing) return "border-line bg-white";
    if (t.order || t.hold?.live) return "border-madder bg-madder/5 hover:bg-madder/10";
    if (t.hold) return "border-brass bg-brass/10 hover:bg-brass/20";
    return "border-line bg-white hover:border-brass";
  }

  function TileBody({ t }: { t: BoardTile }) {
    return (
      <>
        <div className="flex items-start gap-2">
          <TableDiagram
            shape={t.shape}
            capacity={t.capacity}
            className={`size-10 shrink-0 ${
              t.order || t.hold?.live ? "text-madder" : t.hold ? "text-brass" : "text-leaf"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight">{t.name}</p>
            <p className="text-xs text-ink-soft">{`${t.capacity} seats`}</p>
          </div>
        </div>
        {!editing &&
          (t.order ? (
            <div className="mt-2 space-y-0.5 text-sm">
              <p className="truncate font-medium">{t.order.customerName}</p>
              <p className="font-mono text-madder-deep">{t.order.price}</p>
              <p className="text-xs text-ink-soft">
                {`${t.order.itemCount} items · ${t.order.minutes} min`}
              </p>
              {t.order.holdNote && <p className="text-xs text-brass-deep">{t.order.holdNote}</p>}
            </div>
          ) : t.hold ? (
            <div className="mt-2 space-y-0.5 text-sm">
              <p className={`text-xs font-semibold uppercase ${t.hold.live ? "text-madder-deep" : "text-brass-deep"}`}>
                {t.hold.live ? "Occupied · reserved" : "Reserved"}
              </p>
              <p className="truncate font-medium">{t.hold.customerName}</p>
              <p className="text-xs text-ink-soft">{t.hold.line}</p>
              <p className="text-xs text-ink-soft">Tap to seat them</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Free — tap to seat</p>
          ))}
      </>
    );
  }

  return (
    <>
      {dialog}
      {/* Pause polling while a manager edits: a refresh mid-edit discards it. */}
      {!editing && <AutoRefresh seconds={15} />}

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-6">
        <h1 className="font-display text-2xl">Tables</h1>
        <p className="text-sm text-ink-soft">
          {`${taken} of ${live.length} taken${upcoming > 0 ? ` · ${upcoming} booked later` : ""}`}
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/pos/reservations" className="text-sm text-ink-soft underline underline-offset-4">
          Bookings →
        </Link>
        <span className="flex-1" />
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            className={`btn text-sm ${editing ? "btn-primary" : ""}`}
          >
            {editing ? "Done editing" : "Edit floor"}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={addTable} className="mt-4 border border-line bg-white p-4">
          <p className="font-medium">Add a table</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-sm font-medium">Name</span>
              <input
                type="text"
                maxLength={100}
                placeholder="T7"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1 w-28 border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Seats</span>
              <input
                type="number"
                min={1}
                max={50}
                inputMode="numeric"
                value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
                className="mt-1 w-20 border border-line bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">
                Zone <span className="font-normal text-ink-soft">— optional</span>
              </span>
              <input
                type="text"
                list="zone-options"
                maxLength={60}
                placeholder="Courtyard"
                value={draft.zone}
                onChange={(e) => setDraft({ ...draft, zone: e.target.value })}
                className="mt-1 w-40 border border-line bg-white px-3 py-2.5"
              />
            </label>
            <datalist id="zone-options">
              {zoneOptions.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
            <label className="block">
              <span className="block text-sm font-medium">Shape</span>
              <select
                value={draft.shape}
                onChange={(e) => setDraft({ ...draft, shape: e.target.value })}
                className="mt-1 border border-line bg-white px-3 py-2.5"
              >
                {shapes.map((s) => (
                  <option key={s} value={s}>
                    {SHAPE_LABEL[s] ?? s}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-40">
              Add
            </button>
          </div>
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

      {groups.map(([zone, rows]) => (
        <section key={zone} className="mt-5">
          <h2 className="eyebrow">
            {`${zone} · ${rows.length} ${rows.length === 1 ? "table" : "tables"}`}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((t) =>
              editing ? (
                <div key={t.id} className={`border p-3 ${tileClass(t)}`}>
                  <TileBody t={t} />
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2">
                    <button
                      type="button"
                      onClick={() => void editTable(t)}
                      disabled={busy}
                      className="btn px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => cycleShape(t)} disabled={busy} className="btn px-2 py-1 text-xs">
                      {SHAPE_LABEL[t.shape] ?? t.shape}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(t)}
                      disabled={busy}
                      className="btn px-2 py-1 text-xs text-madder-deep"
                    >
                      {t.hasHistory ? "Retire" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  key={t.id}
                  href={`/pos/tables/${t.id}`}
                  className={`block border p-3 transition-colors ${tileClass(t)}`}
                >
                  <TileBody t={t} />
                </Link>
              ),
            )}
          </div>
        </section>
      ))}

      {editing && retired.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow">{`Retired · ${retired.length}`}</h2>
          <ul className="mt-2 divide-y divide-line border border-line bg-white">
            {retired.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                <TableDiagram shape={t.shape} capacity={t.capacity} className="size-8 text-ink-soft" />
                <span className="font-display text-lg text-ink-soft line-through">{t.name}</span>
                <span className="text-sm text-ink-soft">{`${t.capacity} seats`}</span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => void call(`/api/tables/${t.id}`, "PATCH", { active: true })}
                  disabled={busy}
                  className="btn text-sm"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {live.length === 0 && (
        <p className="mt-8 text-ink-soft">
          {canEdit
            ? "No tables yet — tap “Edit floor” to add the first one."
            : "No tables set up yet — a manager can add them from this screen."}
        </p>
      )}
    </>
  );
}
