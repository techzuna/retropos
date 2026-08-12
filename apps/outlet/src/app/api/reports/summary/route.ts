import type { NextRequest } from "next/server";
import { salesSummary } from "@/lib/reports";
import { requireRole } from "@/lib/session";
import { reportQuerySchema } from "@/lib/validation";
import { handle } from "../../respond";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const session = await requireRole("manager");
    const q = request.nextUrl.searchParams;
    const input = reportQuerySchema.parse({
      from: q.get("from"),
      to: q.get("to"),
      groupBy: q.get("groupBy") ?? undefined,
    });
    return await salesSummary(session, input);
  });
}
