import { NextResponse, type NextRequest } from "next/server";
import { BookingError, createReservation } from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";
import { createReservationSchema } from "@/lib/validation";
import { publicReservation } from "../reservation-view";

export async function POST(request: NextRequest) {
  // First XFF hop is trustworthy on Vercel (the platform overwrites it);
  // revisit if hosting moves somewhere that forwards client-supplied XFF.
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!rateLimit(`reserve:${ip}`)) {
    return NextResponse.json(
      { error: "Too many booking attempts — please try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send booking details as JSON." }, { status: 400 });
  }

  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the booking details.",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  try {
    const reservation = await createReservation(parsed.data);
    return NextResponse.json(publicReservation(reservation), { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === "SLOT_UNAVAILABLE" ? 409 : 422;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    throw err;
  }
}
