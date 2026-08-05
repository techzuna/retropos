import { createOutlet, listOutlets } from "@/lib/admin";
import { requireRole } from "@/lib/session";
import { outletSchema } from "@/lib/validation";
import { handle } from "../respond";

export async function GET() {
  return handle(async () => {
    const session = await requireRole("manager");
    const outlets = await listOutlets(session);
    // Managers see only their own outlet; owners see all.
    return {
      outlets: session.role === "owner" ? outlets : outlets.filter((o) => o.id === session.outletId),
    };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("owner");
    const input = outletSchema.parse(await request.json());
    const outlet = await createOutlet(session, input);
    return { outletId: outlet.id };
  });
}
