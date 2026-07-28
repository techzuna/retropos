import { Resend } from "resend";
import type { Reservation, Restaurant } from "@/generated/prisma/client";
import { formatDateTime } from "./format";

export type ReservationEmailKind = "confirmed" | "cancelled";

/**
 * Fire-and-forget by contract: a failed email must never fail or roll back
 * the booking it describes, so every error is caught here. Logs carry the
 * reservation id only — never guest details.
 */
export async function sendReservationEmail(
  kind: ReservationEmailKind,
  reservation: Reservation,
  restaurant: Restaurant,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email] ${kind} email skipped for reservation ${reservation.id} (email not configured)`);
    return;
  }

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const when = formatDateTime(reservation.startsAt, restaurant.timezone);
  const manageUrl = `${baseUrl}/reservation/${reservation.cancelToken}`;

  const subject =
    kind === "confirmed"
      ? `Booking confirmed — ${restaurant.name}, ${when}`
      : `Booking cancelled — ${restaurant.name}`;

  const text =
    kind === "confirmed"
      ? [
          `Hi ${reservation.guestName},`,
          ``,
          `Your table at ${restaurant.name} is confirmed.`,
          ``,
          `When: ${when}`,
          `Party size: ${reservation.partySize}`,
          ``,
          `View or cancel your booking: ${manageUrl}`,
          ``,
          `${restaurant.name} · ${restaurant.address} · ${restaurant.phone}`,
        ].join("\n")
      : [
          `Hi ${reservation.guestName},`,
          ``,
          `Your booking at ${restaurant.name} for ${when} has been cancelled.`,
          ``,
          `Changed your mind? Book again: ${baseUrl}/book`,
          ``,
          `${restaurant.name} · ${restaurant.address} · ${restaurant.phone}`,
        ].join("\n");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: reservation.guestEmail, subject, text });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(
      `[email] ${kind} email failed for reservation ${reservation.id}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
