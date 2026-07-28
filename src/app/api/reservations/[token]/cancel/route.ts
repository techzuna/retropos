import { NextResponse } from "next/server";
import { BookingError, cancelReservation } from "@/lib/booking";
import { publicReservation } from "../../../reservation-view";

export async function POST(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    const reservation = await cancelReservation(token);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }
    return NextResponse.json(publicReservation(reservation));
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    throw err;
  }
}
