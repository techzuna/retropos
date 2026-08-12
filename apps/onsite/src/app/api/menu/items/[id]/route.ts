import { deleteItem, updateItem } from "@/lib/menu";
import { requireRole } from "@/lib/session";
import { menuItemPatchSchema } from "@restro/domain/validation";
import { handle } from "../../../respond";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const input = menuItemPatchSchema.parse(await request.json());
    await updateItem(session, id, input);
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    await deleteItem(session, id);
  });
}
