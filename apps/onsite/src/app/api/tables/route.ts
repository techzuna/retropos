import { getTableBoard } from "@/lib/orders";
import { createTable } from "@/lib/tables";
import { requireRole } from "@/lib/session";
import { tableSchema } from "@restro/domain/validation";
import { handle } from "../respond";

/** The live board — every signed-in staff member's home screen. */
export async function GET() {
  return handle(async () => {
    const session = await requireRole("staff");
    return { tables: await getTableBoard(session) };
  });
}

/** Add a table to the floor plan. Manager+: outlet-level setup, like the menu. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const input = tableSchema.parse(await request.json());
    return await createTable(session, input);
  });
}
