import { cancelReservation, updateReservation } from "@/lib/reservations";
import { requireRole } from "@/lib/session";
import { reservationPatchSchema } from "@restro/domain/validation";
import { handle } from "../../respond";

type Ctx = { params: Promise<{ id: string }> };

/** Reschedule, move table, correct the name or party size. */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    const input = reservationPatchSchema.parse(await request.json());
    await updateReservation(session, id, input);
  });
}

/** Cancel — kept as a row, so the day's history shows what was called off. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    await cancelReservation(session, id);
  });
}
