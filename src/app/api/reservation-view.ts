import type { Reservation } from "@/generated/prisma/client";

/**
 * The reservation as its owner may see it. Internal ids, table assignment,
 * and other diners' anything stay server-side; the token is included because
 * the caller necessarily already holds it.
 */
export function publicReservation(reservation: Reservation) {
  return {
    token: reservation.cancelToken,
    status: reservation.status,
    startsAt: reservation.startsAt.toISOString(),
    partySize: reservation.partySize,
    guestName: reservation.guestName,
    notes: reservation.notes,
  };
}
