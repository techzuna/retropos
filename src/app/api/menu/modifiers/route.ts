import { createModifier, listModifiers } from "@/lib/modifiers";
import { requireRole } from "@/lib/session";
import { modifierSchema } from "@/lib/validation";
import { handle } from "../../respond";

/** Staff need the catalogue to render the extras rows on the order screen. */
export async function GET() {
  return handle(async () => {
    const session = await requireRole("staff");
    return { modifiers: await listModifiers(session) };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const input = modifierSchema.parse(await request.json());
    return await createModifier(session, input);
  });
}
