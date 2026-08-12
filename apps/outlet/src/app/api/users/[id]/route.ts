import { updateUser } from "@/lib/admin";
import { requireRole } from "@/lib/session";
import { userPatchSchema } from "@restro/domain/validation";
import { handle } from "../../respond";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("owner");
    const { id } = await ctx.params;
    const input = userPatchSchema.parse(await request.json());
    await updateUser(session, id, input);
  });
}
