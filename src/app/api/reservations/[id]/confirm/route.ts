import { confirmReservation } from "@/lib/reservations";
import { requireRole } from "@/lib/session";
import { handle } from "../../../respond";

/** Incoming → confirmed: the hold is real and the table is theirs. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    await confirmReservation(session, id);
  });
}
