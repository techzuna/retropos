import { clearActingUser } from "@/lib/session";
import { handle } from "../../respond";

/**
 * Sign the current person out. The device stays paired to its outlet, so the
 * next staff member signs in with their PIN — no manager needed.
 */
export async function POST() {
  return handle(async () => {
    await clearActingUser();
  });
}
