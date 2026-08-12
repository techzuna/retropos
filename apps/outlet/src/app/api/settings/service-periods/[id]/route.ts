import { deleteServicePeriod, updateServicePeriod } from "@/lib/service-periods";
import { requireRole } from "@/lib/session";
import { servicePeriodPatchSchema } from "@/lib/validation";
import { handle } from "../../../respond";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const input = servicePeriodPatchSchema.parse(await request.json());
    await updateServicePeriod(session, id, input);
  });
}

/** Only for a period nothing has been booked into; otherwise retire it. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    await deleteServicePeriod(session, id);
  });
}
