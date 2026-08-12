import { settleOrder } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { settleSchema } from "@/lib/validation";
import { handle } from "../../../respond";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    const input = settleSchema.parse(await request.json());
    const order = await settleOrder(session, id, input.method);
    return { orderId: order.id, totalCents: order.totalCents, settledAt: order.settledAt };
  });
}
