import { signInWithPin } from "@/lib/auth";
import { requireDevice } from "@/lib/session";
import { pinSwitchSchema } from "@restro/domain/validation";
import { clientKeyOf, handle } from "../../respond";

/**
 * Sign in (or hand over) by PIN. Requires only that the device is paired to an
 * outlet — staff have no password and must be able to start their own shift.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const device = await requireDevice();
    const input = pinSwitchSchema.parse(await request.json());
    await signInWithPin(device, input.userId, input.pin, clientKeyOf(request));
  });
}
