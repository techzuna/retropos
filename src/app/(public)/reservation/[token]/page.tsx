import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReservationByToken, isCancellable } from "@/lib/booking";
import { getRestaurant } from "@/lib/restaurant";
import { formatDateTime } from "@/lib/format";
import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Your booking" };

const STATUS_HEADINGS: Record<string, string> = {
  confirmed: "Booking confirmed",
  cancelled: "Booking cancelled",
  seated: "Enjoy your meal",
  completed: "Thanks for coming",
  no_show: "We missed you",
};

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { token } = await params;
  const reservation = await getReservationByToken(token);
  if (!reservation) notFound();

  const isNew = (await searchParams).new === "1";
  const restaurant = await getRestaurant();
  const cancellable = isCancellable(reservation, restaurant.cancelCutoffMin);

  return (
    <section className="mx-auto max-w-md px-5 pt-12">
      {isNew && reservation.status === "confirmed" && (
        <p className="mb-6 border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm">
          See you soon — a confirmation is on its way to your email. Keep this
          page&apos;s link to view or cancel the booking.
        </p>
      )}

      <div className="border border-line bg-white">
        <div className="dhaka-band dhaka-band-brass" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <p className="eyebrow">{restaurant.name}</p>
          <h1 className="mt-2 font-display text-2xl">
            {STATUS_HEADINGS[reservation.status] ?? "Your booking"}
          </h1>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">When</dt>
              <dd className="text-right font-medium">
                {formatDateTime(reservation.startsAt, restaurant.timezone)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Party</dt>
              <dd className="font-medium">
                {reservation.partySize} {reservation.partySize === 1 ? "guest" : "guests"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Booked for</dt>
              <dd className="font-medium">{reservation.guestName}</dd>
            </div>
            {reservation.notes && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Notes</dt>
                <dd className="max-w-[28ch] text-right">{reservation.notes}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="text-ink-soft">Reference</dt>
              <dd className="font-mono uppercase">{reservation.id.slice(-6)}</dd>
            </div>
          </dl>

          {reservation.status === "confirmed" && (
            <div className="mt-8 border-t border-line pt-6">
              {cancellable ? (
                <CancelButton token={token} />
              ) : (
                <p className="text-sm text-ink-soft">
                  It&apos;s too close to your booking to cancel online — call{" "}
                  <a
                    href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`}
                    className="text-madder-deep underline underline-offset-4"
                  >
                    {restaurant.phone}
                  </a>{" "}
                  and we&apos;ll help.
                </p>
              )}
            </div>
          )}

          {reservation.status === "cancelled" && (
            <p className="mt-8 border-t border-line pt-6 text-sm text-ink-soft">
              Changed your mind?{" "}
              <Link href="/book" className="text-madder-deep underline underline-offset-4">
                Book a new table
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/" className="underline underline-offset-4">
          Back to the menu
        </Link>
      </p>
    </section>
  );
}
