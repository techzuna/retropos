import { createCategory, getFullMenu } from "@/lib/menu";
import { requireRole } from "@/lib/session";
import { categorySchema } from "@restro/domain/validation";
import { handle } from "../../respond";

export async function GET() {
  return handle(async () => {
    const session = await requireRole("manager");
    return { categories: await getFullMenu(session) };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const input = categorySchema.parse(await request.json());
    const category = await createCategory(session, input);
    return { categoryId: category.id };
  });
}
