import { createItem } from "@/lib/menu";
import { requireRole } from "@/lib/session";
import { menuItemSchema } from "@/lib/validation";
import { handle } from "../../respond";

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { categoryId, ...input } = menuItemSchema.parse(await request.json());
    const item = await createItem(session, categoryId, input);
    return { itemId: item.id };
  });
}
