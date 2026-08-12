import { addOrderItem } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { addItemSchema } from "@restro/domain/validation";
import { handle } from "../../../respond";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id } = await ctx.params;
    const input = addItemSchema.parse(await request.json());
    const line = await addOrderItem(session, id, input);
    return { itemId: line.id };
  });
}
