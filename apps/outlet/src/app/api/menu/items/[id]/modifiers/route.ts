import { setItemModifiers } from "@/lib/modifiers";
import { requireRole } from "@/lib/session";
import { itemModifiersSchema } from "@/lib/validation";
import { handle } from "../../../../respond";

/** Replace which extras this item offers — the manager sends the full set. */
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const { modifierIds } = itemModifiersSchema.parse(await request.json());
    await setItemModifiers(session, id, modifierIds);
  });
}
