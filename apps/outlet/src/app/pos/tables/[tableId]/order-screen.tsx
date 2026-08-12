"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { useDialog } from "@/components/Dialog";
import { failureMessage } from "@/lib/fetch-error";

interface LineExtra {
  id: string;
  name: string;
  priceCents: number;
}

interface Line {
  id: string;
  menuItemId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  notes: string;
  modifiers: LineExtra[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  available: boolean;
  hasImage: boolean;
  /** Which of the outlet's extras this dish offers; the rest render disabled. */
  modifierIds: string[];
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Modifier {
  id: string;
  name: string;
  priceCents: number;
}

interface OrderScreenProps {
  tableName: string;
  currency: string;
  hasQr: boolean;
  menu: MenuCategory[];
  modifiers: Modifier[];
  initialOrder: { id: string; customerName: string; items: Line[] };
}

const ALL = "all";

/** What one composed card currently costs, before it's committed to the order. */
function draftTotal(item: MenuItem, qty: number, chosen: string[], modifiers: Modifier[]): number {
  const extras = modifiers
    .filter((m) => chosen.includes(m.id))
    .reduce((sum, m) => sum + m.priceCents, 0);
  return (item.priceCents + extras) * qty;
}

function lineTotal(line: Line): number {
  const extras = line.modifiers.reduce((sum, m) => sum + m.priceCents, 0);
  return (line.priceCents + extras) * line.quantity;
}

export function OrderScreen({
  tableName,
  currency,
  hasQr,
  menu,
  modifiers,
  initialOrder,
}: OrderScreenProps) {
  const router = useRouter();
  const { ask, dialog } = useDialog();
  const [items, setItems] = useState<Line[]>(initialOrder.items);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [settling, setSettling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quantities the waiter has tapped but that are not written yet.
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const qtyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Per-card composition, kept client-side until "Add to order". Nothing here
  // is trusted for money: the server re-reads every price at add-time.
  const [drafts, setDrafts] = useState<Record<string, { qty: number; extras: string[] }>>({});
  // Which rows are unfolded. Several may be open at once — a host composing two
  // dishes shouldn't have one collapse under them.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const draftFor = (id: string) => drafts[id] ?? { qty: 1, extras: [] };
  const setDraft = (id: string, patch: Partial<{ qty: number; extras: string[] }>) =>
    setDrafts((d) => ({ ...d, [id]: { ...draftFor(id), ...patch } }));

  const orderId = initialOrder.id;
  const totalCents = items.reduce(
    (sum, it) => sum + lineTotal({ ...it, quantity: pendingQty[it.id] ?? it.quantity }),
    0,
  );

  const categories = [{ id: ALL, name: "All" }, ...menu.map((c) => ({ id: c.id, name: c.name }))];
  const visible =
    activeCategory === ALL
      ? menu.flatMap((c) => c.items.map((i) => ({ item: i, category: c.name })))
      : (menu.find((c) => c.id === activeCategory)?.items ?? []).map((i) => ({
          item: i,
          category: menu.find((c) => c.id === activeCategory)?.name ?? "",
        }));

  async function refetch() {
    const res = await fetch(`/api/orders/${orderId}`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json().catch(() => null);
    if (data?.order?.items) setItems(data.order.items);
  }

  /*
   * Two waiters can be on the same table from different devices. `AutoRefresh`
   * is no use here: the lines live in `items`, client state seeded from props,
   * which `router.refresh()` cannot reach once mounted. So poll the order itself.
   *
   * Paused while our own write is in flight — that mutation refetches anyway,
   * and a poll landing mid-flight would briefly redraw the pre-write state.
   */
  useEffect(() => {
    if (busy) return;
    const timer = setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/orders/${orderId}`).catch(() => null);
        if (!res?.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.order?.items) setItems(data.order.items);
      })();
    }, 15_000);
    return () => clearInterval(timer);
  }, [busy, orderId]);

  async function mutate(fn: () => Promise<Response | null>): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setError(null);
    const res = await fn().catch(() => null);
    // `res === null` is a rejected fetch. It used to fall through this branch
    // silently, so a dropped connection mid-order looked like nothing happened.
    if (!res?.ok) setError(await failureMessage(res));
    await refetch();
    setBusy(false);
    return Boolean(res?.ok);
  }

  async function addToOrder(item: MenuItem) {
    const { qty, extras } = draftFor(item.id);
    const ok = await mutate(() =>
      fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.id, quantity: qty, modifierIds: extras }),
      }),
    );
    // Only on success. Clearing regardless made a rejected add — a sold-out
    // item, a dropped connection — look pixel-identical to a successful one,
    // with the waiter's quantity and extras silently discarded.
    if (!ok) return;
    // Reset and fold the row back up: the composition is on the order now, and
    // the next guest's version starts clean.
    setDrafts((d) => ({ ...d, [item.id]: { qty: 1, extras: [] } }));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  }

  /**
   * Quantity is owned locally while a waiter is tapping, then written once.
   *
   * It used to send `line.quantity + delta` straight from server state on
   * every tap, guarded by a single `busy` flag. On a host where each write
   * takes ~1.4s that silently lost taps: four quick presses of + from 1 landed
   * on 2, because taps two to four hit `if (busy) return` and vanished, and
   * each read the same stale quantity anyway. The bill was then simply wrong,
   * with nothing on screen admitting it.
   *
   * Now the number moves the instant it is tapped and one PATCH follows the
   * flurry, so the total on screen is what gets written.
   */
  function clearPending(lineId: string) {
    setPendingQty((p) => {
      const next = { ...p };
      delete next[lineId];
      return next;
    });
  }

  function displayedQuantity(line: Line): number {
    return pendingQty[line.id] ?? line.quantity;
  }

  function changeQuantity(line: Line, delta: number) {
    const next = displayedQuantity(line) + delta;

    if (next < 1) {
      // Removing is a different act from decrementing — send it immediately
      // rather than debouncing a disappearance.
      clearTimeout(qtyTimers.current[line.id]);
      delete qtyTimers.current[line.id];
      clearPending(line.id);
      void mutate(() => fetch(`/api/orders/${orderId}/items/${line.id}`, { method: "DELETE" }));
      return;
    }

    setPendingQty((p) => ({ ...p, [line.id]: next }));
    clearTimeout(qtyTimers.current[line.id]);
    qtyTimers.current[line.id] = setTimeout(() => {
      delete qtyTimers.current[line.id];
      void (async () => {
        const res = await fetch(`/api/orders/${orderId}/items/${line.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: next }),
        }).catch(() => null);
        if (!res?.ok) setError(await failureMessage(res));
        await refetch();
        // Drop the optimistic value only after the refetch, or the number
        // flicks back to the old server figure for a frame.
        clearPending(line.id);
      })();
    }, 450);
  }

  async function editNote(line: Line) {
    const v = await ask({
      title: `Note for ${line.name}`,
      message: "Goes to the kitchen with this line.",
      fields: [
        { name: "notes", label: "Note", value: line.notes, maxLength: 200, placeholder: "no chilli" },
      ],
    });
    if (!v) return;
    const notes = v.notes;
    void mutate(() =>
      fetch(`/api/orders/${orderId}/items/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }),
    );
  }

  async function settle(method: "qr" | "cash") {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    }).catch(() => null);
    if (res?.ok) {
      router.push(`/pos/bill/${orderId}?done=1`);
      return;
    }
    setBusy(false);
    setError(await failureMessage(res));
    await refetch();
  }

  async function cancelOrder() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      router.push("/pos");
      router.refresh();
      return;
    }
    setBusy(false);
    setCancelling(false);
    setError(await failureMessage(res));
  }

  return (
    <div className="pb-28 pt-6">
      {dialog}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm">
            <Link href="/pos" className="text-ink-soft underline underline-offset-4">
              ← Tables
            </Link>
          </p>
          <h1 className="mt-1 font-display text-2xl">{tableName}</h1>
          <p className="text-sm text-ink-soft">{initialOrder.customerName}</p>
        </div>
        {!cancelling ? (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="text-sm text-ink-soft underline underline-offset-4"
          >
            Cancel order
          </button>
        ) : (
          <span className="text-sm">
            Void this order?{" "}
            <button type="button" onClick={cancelOrder} className="font-semibold text-madder-deep underline">
              Yes
            </button>{" "}
            /{" "}
            <button type="button" onClick={() => setCancelling(false)} className="underline">
              No
            </button>
          </span>
        )}
      </div>

      {/* Order lines */}
      <section className="mt-4 border border-line bg-white">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-soft">Nothing ordered yet — build a dish below.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((line) => (
              <li key={line.id} className="flex items-start gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  {line.modifiers.length > 0 && (
                    <p className="text-xs text-brass">
                      {line.modifiers.map((m) => `+ ${m.name}`).join(" · ")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void editNote(line)}
                    className="text-xs text-ink-soft underline underline-offset-2"
                  >
                    {line.notes || "add note"}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Less ${line.name}`}
                    onClick={() => changeQuantity(line, -1)}
                    className="h-11 w-11 border border-line bg-paper text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono">{displayedQuantity(line)}</span>
                  <button
                    type="button"
                    aria-label={`More ${line.name}`}
                    onClick={() => changeQuantity(line, 1)}
                    className="h-11 w-11 border border-line bg-paper text-lg leading-none"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 pt-3 text-right font-mono text-sm">
                  {formatPrice(lineTotal(line), currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="mt-3 border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep">
          {error}
        </p>
      )}

      {/*
        Menu as a compact list, not cards. The owner's point (2026-07-29): a
        whole menu has to be scannable at a glance and fit on one screen — the
        card version showed two dishes at a time. So a row is name + price +
        Add, and the details a host only sometimes needs (description, quantity,
        extras) unfold when the row is tapped. Tapping Add on a collapsed row is
        the fast path: one of it, no extras.
      */}
      <section className="mt-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              aria-pressed={c.id === activeCategory}
              className={`whitespace-nowrap border px-3 py-2 text-sm ${
                c.id === activeCategory ? "border-madder bg-madder text-paper" : "border-line bg-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <ul className="mt-3 divide-y divide-line border border-line bg-white">
          {visible.map(({ item, category }) => {
            const draft = draftFor(item.id);
            const open = expanded.has(item.id);
            const offeredCount = item.modifierIds.length;
            // A pending composition must be visible on the collapsed row, or
            // tapping Add would quietly apply extras nobody can see.
            const pending =
              draft.qty > 1 || draft.extras.length > 0
                ? [draft.qty > 1 ? `×${draft.qty}` : null, draft.extras.length ? `${draft.extras.length} extra${draft.extras.length === 1 ? "" : "s"}` : null]
                    .filter(Boolean)
                    .join(" · ")
                : null;

            return (
              <li key={item.id} className={item.available ? "" : "opacity-60"}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
                  >
                    {item.hasImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- our own disk; no optimizer on a LAN box */
                      <img
                        src={`/api/menu/items/${item.id}/image`}
                        alt=""
                        className="size-9 shrink-0 border border-line object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center border border-line bg-paper-deep font-display text-sm text-ink-soft"
                      >
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium leading-tight">{item.name}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {pending
                          ? pending
                          : !item.available
                            ? "Sold out today"
                            : activeCategory === ALL
                              ? category
                              : offeredCount > 0
                                ? `${offeredCount} extras`
                                : ""}
                      </span>
                    </span>
                  </button>
                  <span className="shrink-0 font-mono text-sm text-madder-deep">
                    {formatPrice(draftTotal(item, draft.qty, draft.extras, modifiers), currency)}
                  </span>
                  <button
                    type="button"
                    disabled={!item.available || busy}
                    onClick={() => void addToOrder(item)}
                    className="btn btn-secondary shrink-0 whitespace-nowrap px-2.5 py-1.5 text-sm disabled:opacity-40"
                  >
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add to order</span>
                  </button>
                </div>

                {open && (
                  <div className="border-t border-line bg-paper/60 px-3 py-3">
                    {item.description && (
                      <p className="text-sm text-ink-soft">{item.description}</p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium">Quantity</span>
                      <button
                        type="button"
                        aria-label={`Fewer ${item.name}`}
                        disabled={draft.qty <= 1}
                        onClick={() => setDraft(item.id, { qty: draft.qty - 1 })}
                        className="h-9 w-9 border border-line bg-white leading-none disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-mono">{draft.qty}</span>
                      <button
                        type="button"
                        aria-label={`More ${item.name}`}
                        disabled={draft.qty >= 99}
                        onClick={() => setDraft(item.id, { qty: draft.qty + 1 })}
                        className="h-9 w-9 border border-line bg-white leading-none disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    {/* Capped width: full-width pushes each checkbox a screen away from its label. */}
                    {modifiers.length > 0 && (
                      <table className="mt-3 w-full max-w-md text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                            <th className="font-medium">Extras</th>
                            <th className="w-14 text-center font-medium">Add</th>
                            <th className="w-20 text-right font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modifiers.map((m) => {
                            // Not offered on this dish? The row still shows, so
                            // rows sit in the same place on every item — muted.
                            const offered = item.modifierIds.includes(m.id);
                            const checked = draft.extras.includes(m.id);
                            return (
                              <tr
                                key={m.id}
                                className={
                                  checked ? "bg-brass/15" : offered ? "" : "text-ink-soft/40"
                                }
                              >
                                <td className="py-1.5">{m.name}</td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="size-4 align-middle"
                                    disabled={!offered || !item.available}
                                    checked={checked}
                                    aria-label={`${m.name} on ${item.name}`}
                                    onChange={(e) =>
                                      setDraft(item.id, {
                                        extras: e.target.checked
                                          ? [...draft.extras, m.id]
                                          : draft.extras.filter((x) => x !== m.id),
                                      })
                                    }
                                  />
                                </td>
                                <td className="text-right font-mono">
                                  {formatPrice(m.priceCents, currency)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {visible.length === 0 && (
          <p className="mt-6 text-ink-soft">Nothing on the menu in this category yet.</p>
        )}
      </section>

      {/* Settle bar */}
      <div className="no-print fixed inset-x-0 bottom-0 border-t border-line bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <p className="font-mono text-lg">{formatPrice(totalCents, currency)}</p>
          <button
            type="button"
            disabled={items.length === 0 || busy}
            onClick={() => setSettling(true)}
            className="btn btn-primary disabled:opacity-40"
          >
            Settle
          </button>
        </div>
      </div>

      {/* Settle sheet */}
      {settling && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/50 sm:items-center">
          <div className="w-full max-w-md border border-line bg-white">
            <div className="dhaka-band dhaka-band-brass" aria-hidden="true" />
            <div className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl">
                  {`${tableName} · ${formatPrice(totalCents, currency)}`}
                </h2>
                <button type="button" onClick={() => setSettling(false)} className="text-sm underline">
                  Back
                </button>
              </div>
              {hasQr ? (
                <div className="mt-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from our own disk, no optimizer in self-hosted LAN */}
                  <img src="/api/settings/qr" alt="Payment QR" className="max-h-72 w-auto border border-line" />
                </div>
              ) : (
                <p className="mt-4 border border-line bg-paper px-3 py-2 text-sm text-ink-soft">
                  No payment QR uploaded yet — a manager can add it under Admin. Cash still works.
                </p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy || !hasQr}
                  onClick={() => settle("qr")}
                  className="btn btn-primary disabled:opacity-40"
                >
                  Paid by QR
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => settle("cash")}
                  className="btn btn-secondary disabled:opacity-40"
                >
                  Paid cash
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-ink-soft">
                Settling frees the table and opens the bill for printing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
