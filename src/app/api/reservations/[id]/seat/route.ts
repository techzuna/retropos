import { seatReservation } from "@/lib/reservations";
import { requireRole } from "@/lib/session";
import { handle } from "../../../respond";

/** The party arrived: opens their order and links it to the booking. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    const order = await seatReservation(session, id);
    return { orderId: order.id, tableId: order.tableId };
  });
}
