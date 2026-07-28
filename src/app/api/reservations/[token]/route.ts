import { NextResponse } from "next/server";
import { getReservationByToken, isCancellable } from "@/lib/booking";
import { getRestaurant } from "@/lib/restaurant";
import { publicReservation } from "../../reservation-view";

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const reservation = await getReservationByToken(token);
  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }

  const restaurant = await getRestaurant();
  const cancellable = isCancellable(reservation, restaurant.cancelCutoffMin);

  return NextResponse.json({ ...publicReservation(reservation), cancellable });
}
