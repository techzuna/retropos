import { cancelOrder } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { handle } from "../../../respond";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    await cancelOrder(session, id);
  });
}
