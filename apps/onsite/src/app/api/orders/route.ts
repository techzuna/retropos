import { seatTable } from "@/lib/orders";
import { requireRole } from "@/lib/session";
import { seatTableSchema } from "@restro/domain/validation";
import { handle } from "../respond";

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("staff");
    const input = seatTableSchema.parse(await request.json());
    const order = await seatTable(session, input);
    return { orderId: order.id };
  });
}
