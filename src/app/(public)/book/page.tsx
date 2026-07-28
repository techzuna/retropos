import type { Metadata } from "next";
import { addDays, localDate } from "@/lib/availability";
import { getRestaurant, toAvailabilityConfig } from "@/lib/restaurant";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = { title: "Book a table" };

export default async function BookPage() {
  const restaurant = await getRestaurant();
  const config = toAvailabilityConfig(restaurant);
  const today = localDate(new Date(), config.timezone);

  return (
    <section className="mx-auto max-w-xl px-5 pt-12">
      <h1 className="font-display text-3xl">Book a table</h1>
      <p className="mt-2 text-ink-soft">
        Pick a day and party size, choose a time, and the table is yours.
      </p>
      <BookingForm
        phone={restaurant.phone}
        maxPartySize={restaurant.maxPartySize}
        minDate={today}
        maxDate={addDays(today, restaurant.bookingHorizonDays)}
      />
    </section>
  );
}
