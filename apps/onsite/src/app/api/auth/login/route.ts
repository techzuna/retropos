import { loginWithPassword } from "@/lib/auth";
import { loginSchema } from "@restro/domain/validation";
import { clientKeyOf, handle } from "../../respond";

export async function POST(request: Request) {
  return handle(async () => {
    const input = loginSchema.parse(await request.json());
    const session = await loginWithPassword(
      input.email,
      input.password,
      clientKeyOf(request),
      input.outletId,
    );
    return { role: session.role, outletId: session.outletId };
  });
}
