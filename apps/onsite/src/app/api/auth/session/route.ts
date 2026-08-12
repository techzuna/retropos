import { listSwitchableUsers } from "@/lib/auth";
import { getOutletProfile } from "@/lib/outlet";
import { getSession, requireDevice } from "@/lib/session";
import { handle } from "../../respond";

/** Who is on this device, which outlet it's paired to, and who else can sign in. */
export async function GET() {
  return handle(async () => {
    const device = await requireDevice();
    const [session, outlet, switchable] = await Promise.all([
      getSession(),
      getOutletProfile(device),
      listSwitchableUsers(device),
    ]);
    return {
      user: session
        ? { id: session.userId, name: session.userName, role: session.role }
        : null,
      outlet: { id: outlet.id, name: outlet.name, currency: outlet.currency },
      switchable,
    };
  });
}
