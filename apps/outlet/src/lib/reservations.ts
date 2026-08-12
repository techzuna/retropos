import { PosError } from "@restro/domain/errors";
import {
  ACTIVE_RESERVATION_STATUSES,
  ALL_DAY_LABEL,
  DEFAULT_CUSTOMER_NAME,
  HOLDING_RESERVATION_STATUSES,
  displayReservationStatus,
  type ReservationStatus,
} from "@restro/domain/constants";
import { isCanonicalDate, isCanonicalTime, localDate, wallTimeToUtc } from "@restro/domain/time";
import type { SessionContext } from "./session";

/**
 * Table bookings, staff-side: a host takes a name and a **service period** and
 * holds a table for it.
 *
 * Three things shape this module:
 *
 * 1. **Bookings are taken by period, not by clock time.** A restaurant can't
 *    promise a party will sit at 19:15; it can promise them dinner. The chosen
 *    `ServicePeriod`'s wall-clock window is what becomes the stored UTC hold, so
 *    everything below still reasons in instants.
 * 2. **Reserved is derived, never stored.** There is no status column on
 *    DiningTable — a table is reserved at instant T iff an active reservation
 *    covers T, exactly as it is occupied iff an open order exists. The two are
 *    independent: a table booked for dinner can be occupied by a walk-in now.
 * 3. **A live hold reads as taken on the board, but seating is never refused.**
 *    The board shows a table whose window covers *now* as occupied (owner's
 *    call, 2026-07-29) so nobody walks a party onto a held table by accident.
 *    The domain still refuses nothing: if the host decides a walk-in takes it,
 *    `seatTable` works, because software must not strand paying customers over a
 *    row in a database.
 *
 * Windows are half-open `[startAt, endAt)` in UTC, so a lunch ending at 15:00
 * and a dinner starting at 18:00 never collide — nor would back-to-back ones.
 */

/** How long before its start a booking starts showing on the table board. */
export const RESERVATION_LEAD_MINUTES = 45;

export interface ReservationWindow {
  startAt: Date;
  endAt: Date;
}

/**
 * Do two half-open windows overlap? Pure and exported for tests — every
 * double-booking guarantee in the app reduces to this one comparison.
 */
export function windowsOverlap(a: ReservationWindow, b: ReservationWindow): boolean {
  return a.startAt < b.endAt && a.endAt > b.startAt;
}

export interface ReservationInput {
  tableId: string;
  customerName: string;
  phone?: string;
  email?: string;
  partySize: number;
  /** Take the booking as unconfirmed — the host still has to ring back. */
  needsConfirmation?: boolean;
  /** Outlet-local calendar date, "YYYY-MM-DD". */
  date: string;
  /**
   * Which service period the party is coming for — Lunch, Dinner. Exactly one
   * of `servicePeriodId` or `allDay` is required: a host is never asked for a
   * clock time, because no restaurant can promise 19:15.
   */
  servicePeriodId?: string;
  allDay?: boolean;
  notes?: string;
}

/** The calendar day after `date`, as "YYYY-MM-DD". */
function nextDay(date: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Turn the host's local date + chosen period into UTC instants, plus the label
 * to snapshot onto the booking.
 *
 * `allDay` spans local midnight to the next local midnight, which is why it goes
 * through `wallTimeToUtc` on the following date rather than adding 24 hours — a
 * DST shift makes those different lengths.
 */
async function resolveWindow(
  ctx: SessionContext,
  input: Pick<ReservationInput, "date" | "servicePeriodId" | "allDay">,
  timezone: string,
): Promise<ReservationWindow & { periodLabel: string; servicePeriodId: string | null }> {
  if (!isCanonicalDate(input.date)) {
    throw new PosError("VALIDATION", "Give a real date as YYYY-MM-DD.");
  }
  if (input.allDay) {
    return {
      startAt: wallTimeToUtc(input.date, "00:00", timezone),
      endAt: wallTimeToUtc(nextDay(input.date), "00:00", timezone),
      periodLabel: ALL_DAY_LABEL,
      servicePeriodId: null,
    };
  }

  if (!input.servicePeriodId) {
    throw new PosError("VALIDATION", "Pick a service period, or hold the table all day.");
  }
  const period = await ctx.db.servicePeriod.findFirst({
    where: { id: input.servicePeriodId, outletId: ctx.outletId, active: true },
    select: { id: true, name: true, startTime: true, endTime: true },
  });
  if (!period) {
    throw new PosError("NOT_FOUND", "That service period isn't set up for this outlet.");
  }
  if (!isCanonicalTime(period.startTime) || !isCanonicalTime(period.endTime)) {
    throw new PosError("VALIDATION", `${period.name} has an invalid time window — fix it first.`);
  }
  return {
    startAt: wallTimeToUtc(input.date, period.startTime, timezone),
    endAt: wallTimeToUtc(input.date, period.endTime, timezone),
    // Snapshot the name: renaming "Dinner" later must not relabel tonight's book.
    periodLabel: period.name,
    servicePeriodId: period.id,
  };
}

async function outletTimezone(ctx: SessionContext): Promise<string> {
  const outlet = await ctx.db.outlet.findUniqueOrThrow({
    where: { id: ctx.outletId },
    select: { timezone: true },
  });
  return outlet.timezone;
}

/**
 * Book a table. Rejects a window that clashes with an existing active booking
 * on the same table, checked inside the transaction that inserts — SQLite
 * serializes writes, so check-then-insert cannot interleave (the same guarantee
 * `seatTable` relies on).
 */
export async function createReservation(ctx: SessionContext, input: ReservationInput) {
  const timezone = await outletTimezone(ctx);
  const { startAt, endAt, periodLabel, servicePeriodId } = await resolveWindow(ctx, input, timezone);

  const table = await ctx.db.diningTable.findFirst({
    where: { id: input.tableId, outletId: ctx.outletId, active: true },
    select: { id: true, name: true, capacity: true },
  });
  if (!table) throw new PosError("NOT_FOUND", "No such table in this outlet.");

  // A party that doesn't fit is a booking that will fail at the door.
  if (input.partySize > table.capacity) {
    throw new PosError(
      "VALIDATION",
      `${table.name} seats ${table.capacity}. Pick a bigger table for ${input.partySize}.`,
    );
  }
  // Yesterday's booking is a typo, not a plan. A window that has already ended
  // is refused; one that has merely started is fine (walk-in being logged).
  if (endAt.getTime() <= Date.now()) {
    throw new PosError("VALIDATION", "That time has already passed.");
  }

  return ctx.db.$transaction(async (tx) => {
    const clash = await tx.reservation.findFirst({
      where: {
        tableId: table.id,
        status: { in: [...ACTIVE_RESERVATION_STATUSES] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, customerName: true, startAt: true },
    });
    if (clash) {
      throw new PosError(
        "TABLE_DOUBLE_BOOKED",
        `${table.name} is already held for ${clash.customerName} in that window.`,
      );
    }
    return tx.reservation.create({
      data: {
        outletId: ctx.outletId,
        tableId: table.id,
        customerName: input.customerName.trim() || DEFAULT_CUSTOMER_NAME,
        phone: input.phone?.trim() ?? "",
        email: input.email?.trim().toLowerCase() ?? "",
        partySize: input.partySize,
        startAt,
        endAt,
        allDay: input.allDay ?? false,
        servicePeriodId,
        periodLabel,
        // A host taking the booking IS the confirmation, so staff entry lands
        // as `confirmed` and doesn't make them confirm their own typing.
        // `incoming` is for a hold that still needs chasing.
        status: input.needsConfirmation ? "incoming" : "confirmed",
        notes: input.notes?.trim() ?? "",
        createdById: ctx.userId,
      },
    });
  });
}

/** One outlet-local day's bookings, earliest first. */
export async function listReservations(ctx: SessionContext, date?: string) {
  const timezone = await outletTimezone(ctx);
  const day = date ?? localDate(new Date(), timezone);
  if (!isCanonicalDate(day)) throw new PosError("VALIDATION", "Give a real date as YYYY-MM-DD.");

  // Anything overlapping the local day, so an all-day or late booking made on
  // the previous date still shows on the day it actually runs.
  const dayStart = wallTimeToUtc(day, "00:00", timezone);
  const dayEnd = new Date(dayStart.getTime() + 25 * 60 * 60 * 1000);

  const rows = await ctx.db.reservation.findMany({
    where: { outletId: ctx.outletId, startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
    orderBy: [{ startAt: "asc" }, { customerName: "asc" }],
    include: {
      table: { select: { id: true, name: true, zone: true, capacity: true, shape: true } },
      createdBy: { select: { name: true } },
      order: { select: { id: true, status: true, totalCents: true } },
    },
  });

  // `completed` is derived from the linked order being settled rather than
  // stored, so a booking card can never disagree with the bill it produced.
  const reservations = rows.map((r) => ({
    ...r,
    displayStatus: displayReservationStatus(r.status, r.order?.status),
  }));

  return { date: day, timezone, reservations };
}

/**
 * The board's view: for each table, the booking that matters right now — the
 * one covering this instant, else the next one starting within the lead window.
 *
 * Only **holding** rows count (`incoming`, `confirmed`), unlike the overlap
 * check which also counts `seated` (a seated party still owns its window, so
 * nothing may be booked over it). The difference matters: a hold on the board is
 * an invitation to seat someone, and a `seated` booking can't be seated again —
 * including it would leave a tile offering "tap to seat them" for a party
 * already dealt with, whose order may since have been settled or cancelled.
 */
export async function reservationHoldsByTable(
  ctx: SessionContext,
  now: Date = new Date(),
): Promise<
  Map<
    string,
    {
      id: string;
      customerName: string;
      partySize: number;
      periodLabel: string;
      allDay: boolean;
      startAt: Date;
      endAt: Date;
      active: boolean;
      confirmed: boolean;
    }
  >
> {
  const horizon = new Date(now.getTime() + RESERVATION_LEAD_MINUTES * 60_000);
  const rows = await ctx.db.reservation.findMany({
    where: {
      outletId: ctx.outletId,
      status: { in: [...HOLDING_RESERVATION_STATUSES] },
      startAt: { lt: horizon },
      endAt: { gt: now },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      tableId: true,
      customerName: true,
      partySize: true,
      startAt: true,
      endAt: true,
      status: true,
      periodLabel: true,
      allDay: true,
    },
  });

  const byTable = new Map<string, ReturnType<typeof holdOf>>();
  function holdOf(r: (typeof rows)[number]) {
    return {
      id: r.id,
      customerName: r.customerName,
      partySize: r.partySize,
      periodLabel: r.periodLabel || (r.allDay ? ALL_DAY_LABEL : "Booking"),
      allDay: r.allDay,
      confirmed: r.status === "confirmed",
      startAt: r.startAt,
      endAt: r.endAt,
      active: r.startAt <= now,
    };
  }
  // Earliest-first, so the first row per table is the one to show.
  for (const r of rows) if (!byTable.has(r.tableId)) byTable.set(r.tableId, holdOf(r));
  return byTable;
}

/** A booking still open to changes: taken, not yet seated or closed out. */
async function openReservation(ctx: SessionContext, id: string) {
  const reservation = await ctx.db.reservation.findFirst({
    where: { id, outletId: ctx.outletId },
    select: { id: true, status: true, tableId: true, customerName: true, partySize: true },
  });
  if (!reservation) throw new PosError("NOT_FOUND", "Booking not found.");
  if (!HOLDING_RESERVATION_STATUSES.includes(reservation.status as "incoming" | "confirmed")) {
    throw new PosError(
      "RESERVATION_CLOSED",
      `This booking is already ${reservation.status.replace("_", " ")}.`,
    );
  }
  return reservation;
}

/** Incoming → confirmed: the host rang back and the table is really held. */
export async function confirmReservation(ctx: SessionContext, id: string): Promise<void> {
  const reservation = await openReservation(ctx, id);
  if (reservation.status === "confirmed") return; // idempotent: double-tap is harmless
  const { count } = await ctx.db.reservation.updateMany({
    where: { id, outletId: ctx.outletId, status: "incoming" },
    data: { status: "confirmed" },
  });
  if (count === 0) throw new PosError("RESERVATION_CLOSED", "This booking was already closed.");
}

export async function updateReservation(
  ctx: SessionContext,
  id: string,
  input: Partial<ReservationInput>,
) {
  const existing = await openReservation(ctx, id);
  const timezone = await outletTimezone(ctx);
  const current = await ctx.db.reservation.findUniqueOrThrow({
    where: { id },
    select: {
      startAt: true,
      endAt: true,
      allDay: true,
      tableId: true,
      partySize: true,
      servicePeriodId: true,
      periodLabel: true,
    },
  });

  const tableId = input.tableId ?? current.tableId;
  const table = await ctx.db.diningTable.findFirst({
    where: { id: tableId, outletId: ctx.outletId, active: true },
    select: { id: true, name: true, capacity: true },
  });
  if (!table) throw new PosError("NOT_FOUND", "No such table in this outlet.");

  const partySize = input.partySize ?? current.partySize;
  if (partySize > table.capacity) {
    throw new PosError(
      "VALIDATION",
      `${table.name} seats ${table.capacity}. Pick a bigger table for ${partySize}.`,
    );
  }

  // Only recompute the window when the caller actually sent one; a plain
  // rename must not have to restate the day or the period.
  const rescheduling =
    input.date !== undefined ||
    input.servicePeriodId !== undefined ||
    input.allDay !== undefined;
  const window = rescheduling
    ? await resolveWindow(
        ctx,
        {
          date: input.date ?? localDate(current.startAt, timezone),
          servicePeriodId: input.servicePeriodId ?? current.servicePeriodId ?? undefined,
          allDay: input.allDay ?? (input.servicePeriodId ? false : current.allDay),
        },
        timezone,
      )
    : {
        startAt: current.startAt,
        endAt: current.endAt,
        periodLabel: current.periodLabel,
        servicePeriodId: current.servicePeriodId,
      };

  await ctx.db.$transaction(async (tx) => {
    const clash = await tx.reservation.findFirst({
      where: {
        id: { not: existing.id },
        tableId: table.id,
        status: { in: [...ACTIVE_RESERVATION_STATUSES] },
        startAt: { lt: window.endAt },
        endAt: { gt: window.startAt },
      },
      select: { customerName: true },
    });
    if (clash) {
      throw new PosError(
        "TABLE_DOUBLE_BOOKED",
        `${table.name} is already held for ${clash.customerName} in that window.`,
      );
    }
    await tx.reservation.update({
      where: { id: existing.id },
      data: {
        tableId: table.id,
        partySize,
        startAt: window.startAt,
        endAt: window.endAt,
        ...(rescheduling
          ? {
              allDay: input.allDay ?? (input.servicePeriodId ? false : current.allDay),
              servicePeriodId: window.servicePeriodId,
              periodLabel: window.periodLabel,
            }
          : {}),
        ...(input.customerName !== undefined ? { customerName: input.customerName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
      },
    });
  });
}

/** Guarded status change: only a still-holding row can be closed out. */
async function closeReservation(ctx: SessionContext, id: string, status: ReservationStatus) {
  await openReservation(ctx, id);
  const { count } = await ctx.db.reservation.updateMany({
    where: { id, outletId: ctx.outletId, status: { in: [...HOLDING_RESERVATION_STATUSES] } },
    data: { status },
  });
  if (count === 0) throw new PosError("RESERVATION_CLOSED", "This booking was already closed.");
}

export const cancelReservation = (ctx: SessionContext, id: string) =>
  closeReservation(ctx, id, "cancelled");

export const markNoShow = (ctx: SessionContext, id: string) =>
  closeReservation(ctx, id, "no_show");

/**
 * The party arrived: open an order on the booked table and link the two, so the
 * bill carries the booking's name and the board stops advertising the hold.
 *
 * Both writes are one transaction — a booking marked seated with no order would
 * leave the table looking free while the party sits at it.
 *
 * An `incoming` booking is confirmed on the way through rather than refused:
 * the party standing at the door is the strongest confirmation there is, and
 * making the host tap Confirm first would be ceremony at the worst moment.
 */
export async function seatReservation(ctx: SessionContext, id: string) {
  const reservation = await openReservation(ctx, id);

  return ctx.db.$transaction(async (tx) => {
    const openOrder = await tx.order.findFirst({
      where: { tableId: reservation.tableId, status: "open" },
      select: { id: true },
    });
    if (openOrder) {
      throw new PosError("TABLE_OCCUPIED", "That table already has an open order.");
    }
    const order = await tx.order.create({
      data: {
        outletId: ctx.outletId,
        tableId: reservation.tableId,
        customerName: reservation.customerName,
        guestCount: reservation.partySize,
        openedById: ctx.userId,
      },
    });
    const { count } = await tx.reservation.updateMany({
      where: { id: reservation.id, status: { in: [...HOLDING_RESERVATION_STATUSES] } },
      data: { status: "seated", orderId: order.id },
    });
    if (count === 0) throw new PosError("RESERVATION_CLOSED", "This booking was already closed.");
    return order;
  });
}
