import { z } from "zod";
import { switchOutlet } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import { handle } from "../../respond";

const schema = z.object({ outletId: z.string().min(1).max(64) });

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("owner");
    const input = schema.parse(await request.json());
    await switchOutlet(session, input.outletId);
  });
}
