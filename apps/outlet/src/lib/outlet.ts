import { PosError } from "./errors";
import type { DeviceContext } from "./session";

/**
 * The paired outlet's own details — name for the chrome, currency for every
 * price, timezone for bill timestamps, address/phone/QR for the bill and
 * settle sheet.
 *
 * One helper rather than a per-screen `select`: this replaced nine
 * near-identical `outlet.findUnique` calls scattered across pages and route
 * handlers, which was the last place outside `src/lib` still reaching for
 * Prisma directly (AGENTS.md: no route touches Prisma for tenant data). It is
 * a single narrow row, so fetching all of it everywhere costs nothing.
 */
export async function getOutletProfile(ctx: DeviceContext) {
  const outlet = await ctx.db.outlet.findFirst({
    where: { id: ctx.outletId, organizationId: ctx.orgId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      currency: true,
      timezone: true,
      qrImagePath: true,
    },
  });
  if (!outlet) throw new PosError("NOT_FOUND", "Outlet not found.");
  return outlet;
}
