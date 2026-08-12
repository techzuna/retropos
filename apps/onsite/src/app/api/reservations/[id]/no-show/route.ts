import { markNoShow } from "@/lib/reservations";
import { requireRole } from "@/lib/session";
import { handle } from "../../../respond";

/** They never came: frees the hold and keeps the fact on the day's record. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    await markNoShow(session, id);
  });
}
