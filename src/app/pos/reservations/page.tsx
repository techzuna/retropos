import type { Metadata } from "next";
import { listReservations } from "@/lib/reservations";
import { listBookableTables } from "@/lib/tables";
import { listServicePeriods } from "@/lib/service-periods";
import { requireSession } from "@/lib/session";
import { roleAtLeast } from "@/lib/constants";
import { addDays, localDate, localTimeLabel } from "@/lib/time";
import { ZONE_SUGGESTIONS } from "@/lib/constants";
import { ReservationManager } from "./reservation-manager";

export const metadata: Metadata = { title: "Bookings" };

/** Wrapped so the clock read isn't an impure call in render scope. */
function hasPassed(instant: Date): boolean {
  return instant.getTime() <= Date.now();
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireSession();
  const { date: requested } = await searchParams;

  // Bad dates fall back to today rather than erroring: a mistyped query string
  // shouldn't leave a host staring at a stack trace mid-service.
  const canEditPeriods = roleAtLeast(session.role, "manager");
  const listed = await listReservations(session, requested).catch(() => listReservations(session));
  const [{ date, timezone, reservations }, tables, periods] = await Promise.all([
    listed,
    listBookableTables(session),
    // Managers see retired periods too, so one can be restored.
    listServicePeriods(session, canEditPeriods),
  ]);

  const today = localDate(new Date(), timezone);

  return (
    <ReservationManager
      date={date}
      today={today}
      prevDate={addDays(date, -1)}
      nextDate={addDays(date, 1)}
      tables={tables}
      periods={periods}
      canEditPeriods={canEditPeriods}
      timezone={timezone}
      zoneSuggestions={[...ZONE_SUGGESTIONS]}
      rows={reservations.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        email: r.email,
        partySize: r.partySize,
        status: r.displayStatus,
        notes: r.notes,
        allDay: r.allDay,
        tableId: r.tableId,
        tableName: r.table.name,
        tableZone: r.table.zone,
        tableCapacity: r.table.capacity,
        tableShape: r.table.shape,
        // What the host chose ("Dinner"), with the window it resolved to — the
        // label is the snapshot, so a retimed period never rewrites this row.
        periodLabel: r.periodLabel || (r.allDay ? "All day" : "Booking"),
        startLabel: localTimeLabel(r.startAt, timezone),
        endLabel: localTimeLabel(r.endAt, timezone),
        // A hold nobody seated whose window has run out — the row that needs a
        // decision from the host, so the card can ask for one.
        overdue:
          (r.status === "incoming" || r.status === "confirmed") && hasPassed(r.endAt),
        orderId: r.orderId,
      }))}
    />
  );
}
