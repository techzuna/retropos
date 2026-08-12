import { deleteCategory, updateCategory } from "@/lib/menu";
import { requireRole } from "@/lib/session";
import { categoryPatchSchema } from "@restro/domain/validation";
import { handle } from "../../../respond";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const input = categoryPatchSchema.parse(await request.json());
    await updateCategory(session, id, input);
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    await deleteCategory(session, id);
  });
}
