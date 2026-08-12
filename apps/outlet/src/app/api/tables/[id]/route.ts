import { deleteTable, updateTable } from "@/lib/tables";
import { requireRole } from "@/lib/session";
import { tablePatchSchema } from "@/lib/validation";
import { handle } from "../../respond";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const input = tablePatchSchema.parse(await request.json());
    await updateTable(session, id, input);
  });
}

/** Only ever succeeds for a table with no history — otherwise retire it. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    await deleteTable(session, id);
  });
}
