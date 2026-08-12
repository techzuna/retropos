import { createReservation, listReservations } from "@/lib/reservations";
import { requireRole } from "@/lib/session";
import { reservationQuerySchema, reservationSchema } from "@/lib/validation";
import { handle } from "../respond";

// Bookings are floor work — whoever answers the phone takes them — so these are
// staff-level, like seating and settling.

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireRole("staff");
    const url = new URL(request.url);
    const { date } = reservationQuerySchema.parse({
      date: url.searchParams.get("date") ?? undefined,
    });
    return await listReservations(session, date);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("staff");
    const input = reservationSchema.parse(await request.json());
    return await createReservation(session, input);
  });
}
