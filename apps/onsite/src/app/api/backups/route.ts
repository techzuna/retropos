import {
  getBackupSettings,
  listBackups,
  updateBackupSettings,
  writeBackup,
} from "@/lib/backup";
import { requireRole } from "@/lib/session";
import { backupSettingsSchema } from "@restro/domain/validation";
import { handle } from "../respond";

export async function GET() {
  return handle(async () => {
    const session = await requireRole("owner");
    const [settings, backups] = await Promise.all([
      getBackupSettings(session),
      listBackups(session.orgId),
    ]);
    return { settings, backups };
  });
}

/** Back up now. */
export async function POST() {
  return handle(async () => {
    const session = await requireRole("owner");
    const filename = await writeBackup(session);
    return { filename };
  });
}

/** Change the schedule. */
export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requireRole("owner");
    const input = backupSettingsSchema.parse(await request.json());
    await updateBackupSettings(session, input);
  });
}
