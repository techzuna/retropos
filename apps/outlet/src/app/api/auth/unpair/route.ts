import { requireRole } from "@/lib/session";
import { unpairDevice } from "@/lib/session";
import { handle } from "../../respond";

/**
 * Forget which outlet this device belongs to. Manager+ only: afterwards the
 * tablet needs an email and password before anyone can PIN in, so this is the
 * action for retiring or reassigning a device — not for ending a shift.
 */
export async function POST() {
  return handle(async () => {
    await requireRole("manager");
    await unpairDevice();
  });
}
