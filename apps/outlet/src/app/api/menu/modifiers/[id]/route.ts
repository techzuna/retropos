import { deleteModifier, updateModifier } from "@/lib/modifiers";
import { requireRole } from "@/lib/session";
import { modifierPatchSchema } from "@restro/domain/validation";
import { handle } from "../../../respond";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const input = modifierPatchSchema.parse(await request.json());
    await updateModifier(session, id, input);
  });
}

/** Only for an extra that has never been on a bill; otherwise retire it. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    await deleteModifier(session, id);
  });
}
