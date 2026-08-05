import { removeOrderItem, updateOrderItem } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { updateItemSchema } from "@/lib/validation";
import { handle } from "../../../../respond";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id, itemId } = await ctx.params;
    const input = updateItemSchema.parse(await request.json());
    await updateOrderItem(session, id, itemId, input);
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("staff");
    const { id, itemId } = await ctx.params;
    await removeOrderItem(session, id, itemId);
  });
}
