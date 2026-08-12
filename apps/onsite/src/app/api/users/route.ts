import { createUser, listUsers } from "@/lib/admin";
import { requireRole } from "@/lib/session";
import { userCreateSchema } from "@restro/domain/validation";
import { handle } from "../respond";

export async function GET() {
  return handle(async () => {
    const session = await requireRole("owner");
    return { users: await listUsers(session) };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("owner");
    const input = userCreateSchema.parse(await request.json());
    const user = await createUser(session, input);
    return { userId: user.id };
  });
}
