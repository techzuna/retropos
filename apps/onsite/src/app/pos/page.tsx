import type { Metadata } from "next";
import { getOutletProfile } from "@/lib/outlet";
import { getTableBoard } from "@/lib/orders";
import { listTables } from "@/lib/tables";
import { requireSession } from "@/lib/session";
import { formatPrice } from "@restro/domain/format";
import { localTimeLabel } from "@restro/domain/time";
import { roleAtLeast, TABLE_SHAPES, ZONE_SUGGESTIONS } from "@restro/domain/constants";
import { TableBoard, type BoardTile } from "./table-board";

export const metadata: Metadata = { title: "Tables" };

/** Wrapped so the clock read isn't an impure call in render scope. */
function minutesSince(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000));
}

export default async function TableBoardPage() {
  const session = await requireSession();
  const canEdit = roleAtLeast(session.role, "manager");

  const [tables, outlet, floor] = await Promise.all([
    getTableBoard(session),
    getOutletProfile(session),
    // Only a manager can edit, so only they need retired tables and the
    // history flags that decide Retire vs Delete.
    canEdit ? listTables(session) : Promise.resolve([]),
  ]);

  const meta = new Map(floor.map((t) => [t.id, t]));
  // Everything time- or currency-dependent is formatted here: the board is a
  // client component and must not do timezone or clock work of its own.
  const tiles: BoardTile[] = tables.map((t) => ({
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    zone: t.zone,
    shape: t.shape,
    active: true,
    hasHistory: (meta.get(t.id)?._count.orders ?? 0) > 0 || (meta.get(t.id)?._count.reservations ?? 0) > 0,
    order: t.order
      ? {
          customerName: t.order.customerName,
          price: formatPrice(t.order.totalCents, outlet.currency),
          itemCount: t.order.itemCount,
          minutes: minutesSince(t.order.openedAt),
          holdNote: t.hold
            ? `${t.hold.periodLabel} booking · ${t.hold.customerName}`
            : null,
        }
      : null,
    hold: t.hold
      ? {
          customerName: t.hold.customerName,
          // An all-day hold has no meaningful window to print — "00:00–00:00"
          // is noise, so the label carries it alone.
          line: t.hold.allDay
            ? `${t.hold.periodLabel} · ${t.hold.partySize}p`
            : `${t.hold.periodLabel} · ${localTimeLabel(t.hold.startAt, outlet.timezone)}–${localTimeLabel(t.hold.endAt, outlet.timezone)} · ${t.hold.partySize}p`,
          // `active` means the stored window covers this instant.
          live: t.hold.active,
        }
      : null,
  }));

  // Retired tables aren't on the board; they only exist so a manager can
  // restore one, so they carry no service state.
  const retiredTiles: BoardTile[] = floor
    .filter((t) => !t.active)
    .map((t) => ({
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      zone: t.zone,
      shape: t.shape,
      active: false,
      hasHistory: t._count.orders > 0 || t._count.reservations > 0,
      order: null,
      hold: null,
    }));

  return (
    <TableBoard
      tiles={[...tiles, ...retiredTiles]}
      canEdit={canEdit}
      zoneSuggestions={[...ZONE_SUGGESTIONS]}
      shapes={[...TABLE_SHAPES]}
    />
  );
}
