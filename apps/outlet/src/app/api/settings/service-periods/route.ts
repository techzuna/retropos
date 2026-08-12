import { createServicePeriod, listServicePeriods } from "@/lib/service-periods";
import { requireRole } from "@/lib/session";
import { servicePeriodSchema } from "@/lib/validation";
import { handle } from "../../respond";

/** Staff need the list to take a booking; only a manager sets the hours. */
export async function GET() {
  return handle(async () => {
    const session = await requireRole("staff");
    return { servicePeriods: await listServicePeriods(session) };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const input = servicePeriodSchema.parse(await request.json());
    return await createServicePeriod(session, input);
  });
}
