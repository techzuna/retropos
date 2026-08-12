import { restoreFromFile } from "@/lib/backup";
import { requireRole } from "@/lib/session";
import { restoreSchema } from "@restro/domain/validation";
import { handle } from "../../respond";

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("owner");
    const input = restoreSchema.parse(await request.json());
    await restoreFromFile(session, input.filename);
  });
}
