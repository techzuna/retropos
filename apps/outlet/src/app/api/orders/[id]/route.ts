import { getOrder } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { handle } from "../../respond";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    return { order: await getOrder(session, id) };
  });
}
