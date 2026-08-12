import { getOrderingMenu } from "@/lib/menu";
import { requireRole } from "@/lib/session";
import { handle } from "../respond";

export async function GET() {
  return handle(async () => {
    const session = await requireRole("staff");
    return { categories: await getOrderingMenu(session) };
  });
}
