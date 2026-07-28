import { NextResponse, type NextRequest } from "next/server";
import { BookingError, getBookableSlots } from "@/lib/booking";
import { availabilityQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const parsed = availabilityQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    partySize: request.nextUrl.searchParams.get("partySize"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide date=YYYY-MM-DD and partySize as a whole number." },
      { status: 400 },
    );
  }

  try {
    const { slots } = await getBookableSlots(parsed.data.date, parsed.data.partySize);
    return NextResponse.json({
      date: parsed.data.date,
      partySize: parsed.data.partySize,
      // Table assignment is the restaurant's business — only times leave the server.
      slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), label: s.label })),
    });
  } catch (err) {
    if (err instanceof BookingError && err.code === "PARTY_TOO_LARGE") {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
    }
    throw err;
  }
}
