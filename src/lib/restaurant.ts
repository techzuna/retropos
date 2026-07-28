import { cache } from "react";
import { prisma } from "./db";
import type { AvailabilityConfig, WeeklyHours } from "./availability";
import type { Restaurant } from "@/generated/prisma/client";

/** The single restaurant this deployment serves (see DESIGN.md). */
export const getRestaurant = cache(async (): Promise<Restaurant> => {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error("No restaurant configured — run `npx prisma db seed`.");
  }
  return restaurant;
});

export function toAvailabilityConfig(restaurant: Restaurant): AvailabilityConfig {
  return {
    timezone: restaurant.timezone,
    // Json columns are written only by seed/dashboard code that uses these
    // exact shapes; the cast is the trust boundary.
    weeklyHours: restaurant.openingHours as WeeklyHours,
    closedDates: (restaurant.closedDates as string[]) ?? [],
    diningDurationMin: restaurant.diningDurationMin,
    slotIntervalMin: restaurant.slotIntervalMin,
    bookingHorizonDays: restaurant.bookingHorizonDays,
  };
}
