import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { getRestaurant, toAvailabilityConfig } from "./restaurant";
import { addDays, computeSlots, localDate, wallTimeToUtc, type Slot } from "./availability";
import { sendReservationEmail } from "./email";
import type { Reservation, Restaurant } from "@/generated/prisma/client";

export type BookingFailureCode =
  | "SLOT_UNAVAILABLE"
  | "PARTY_TOO_LARGE"
  | "CUTOFF_PASSED"
  | "NOT_CANCELLABLE";

export class BookingError extends Error {
  constructor(
    public readonly code: BookingFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

const ACTIVE_STATUSES = ["confirmed", "seated"] as const;

export interface BookableDay {
  restaurant: Restaurant;
  slots: Slot[];
}

export async function getBookableSlots(
  date: string,
  partySize: number,
  now: Date = new Date(),
): Promise<BookableDay> {
  const restaurant = await getRestaurant();
  if (partySize > restaurant.maxPartySize) {
    throw new BookingError(
      "PARTY_TOO_LARGE",
      `For parties larger than ${restaurant.maxPartySize}, call us on ${restaurant.phone}.`,
    );
  }

  const config = toAvailabilityConfig(restaurant);
  const tables = await prisma.diningTable.findMany({
    where: { restaurantId: restaurant.id, active: true },
    select: { id: true, capacity: true },
  });

  // Everything overlapping the local calendar day, table-agnostic.
  const dayStart = wallTimeToUtc(date, "00:00", config.timezone);
  const dayEnd = wallTimeToUtc(addDays(date, 1), "00:00", config.timezone);
  const busy = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      status: { in: [...ACTIVE_STATUSES] },
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    select: { tableId: true, startsAt: true, endsAt: true },
  });

  return {
    restaurant,
    slots: computeSlots({ config, tables, reservations: busy, date, partySize, now }),
  };
}

export interface CreateReservationInput {
  startsAt: Date;
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string;
}

/**
 * Books a table for a slot previously offered by availability. The slot is
 * recomputed server-side (hours, horizon, party size, conflicts — nothing is
 * trusted from the client), then tables are tried best-fit first. A losing
 * race surfaces as the `reservation_no_overlap` exclusion constraint firing,
 * in which case the next candidate table is tried.
 */
export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const restaurant = await getRestaurant();
  const config = toAvailabilityConfig(restaurant);
  const date = localDate(input.startsAt, config.timezone);

  const { slots } = await getBookableSlots(date, input.partySize);
  const slot = slots.find((s) => s.startsAt.getTime() === input.startsAt.getTime());
  if (!slot) {
    throw new BookingError("SLOT_UNAVAILABLE", "That time is no longer available — please pick another.");
  }

  for (const tableId of slot.tableIds) {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          restaurantId: restaurant.id,
          tableId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          partySize: input.partySize,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          notes: input.notes,
          cancelToken: randomBytes(24).toString("base64url"), // 192-bit credential
        },
      });
      // Fire-and-forget: email.ts never throws, and the booking must not
      // wait on Resend. (Wrap in next/server `after()` if moved to serverless.)
      void sendReservationEmail("confirmed", reservation, restaurant);
      return reservation;
    } catch (err) {
      if (isOverlapViolation(err)) continue;
      throw err;
    }
  }

  throw new BookingError("SLOT_UNAVAILABLE", "That time was just taken — please pick another.");
}

export function isCancellable(
  reservation: Reservation,
  cancelCutoffMin: number,
  now: Date = new Date(),
): boolean {
  return (
    reservation.status === "confirmed" &&
    reservation.startsAt.getTime() - now.getTime() >= cancelCutoffMin * 60_000
  );
}

export async function getReservationByToken(token: string): Promise<Reservation | null> {
  if (!token || token.length > 64) return null;
  return prisma.reservation.findUnique({ where: { cancelToken: token } });
}

export async function cancelReservation(token: string, now: Date = new Date()): Promise<Reservation | null> {
  const restaurant = await getRestaurant();
  const reservation = await getReservationByToken(token);
  if (!reservation) return null;
  if (reservation.status === "cancelled") return reservation;
  if (reservation.status !== "confirmed") {
    throw new BookingError("NOT_CANCELLABLE", "This booking can no longer be cancelled online.");
  }
  if (reservation.startsAt.getTime() - now.getTime() < restaurant.cancelCutoffMin * 60_000) {
    throw new BookingError(
      "CUTOFF_PASSED",
      `Online cancellation closes ${formatCutoff(restaurant.cancelCutoffMin)} before your booking — call us on ${restaurant.phone} instead.`,
    );
  }

  // Guarded update: the status and cutoff are both re-checked inside the
  // write, so a concurrent status change or a request landing right on the
  // cutoff boundary makes count 0 instead of a bad state.
  const { count } = await prisma.reservation.updateMany({
    where: {
      cancelToken: token,
      status: "confirmed",
      startsAt: { gte: new Date(now.getTime() + restaurant.cancelCutoffMin * 60_000) },
    },
    data: { status: "cancelled" },
  });
  const updated = await prisma.reservation.findUnique({ where: { cancelToken: token } });
  if (count === 0 && updated?.status === "confirmed") {
    throw new BookingError(
      "CUTOFF_PASSED",
      `Online cancellation closes ${formatCutoff(restaurant.cancelCutoffMin)} before your booking — call us on ${restaurant.phone} instead.`,
    );
  }
  if (count > 0 && updated) {
    void sendReservationEmail("cancelled", updated, restaurant);
  }
  return updated;
}

function formatCutoff(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  return `${minutes} minutes`;
}

function isOverlapViolation(err: unknown): boolean {
  // Prisma 7 surfaces the exclusion constraint as PrismaClientKnownRequestError
  // code P2039 with the constraint name in the message (verified live).
  // Match either signal so a message-format change doesn't break the retry.
  if (!(err instanceof Error)) return false;
  const code = (err as Error & { code?: string }).code;
  return err.message.includes("reservation_no_overlap") || code === "P2039";
}
