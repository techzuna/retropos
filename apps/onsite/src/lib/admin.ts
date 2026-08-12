import { PosError } from "@restro/domain/errors";
import { hashSecret } from "./auth";
import type { OrgContext } from "./db";
import type { SessionContext } from "./session";
import type { Role } from "@restro/domain/constants";

// Owner-scope administration: outlets and users. Every function is scoped to
// the session's organization — an owner can never touch another org.

/** The organization itself, for the admin screen header and backup panel. */
export async function getOrganization(ctx: OrgContext) {
  return ctx.db.organization.findUniqueOrThrow({
    where: { id: ctx.orgId },
    select: { name: true, backupFrequency: true, backupRetention: true, lastBackupAt: true },
  });
}

export async function listOutlets(ctx: SessionContext) {
  return ctx.db.outlet.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      currency: true,
      timezone: true,
      qrImagePath: true,
      active: true,
    },
  });
}

export interface OutletInput {
  name: string;
  address?: string;
  phone?: string;
  currency?: string;
  timezone?: string;
}

export async function createOutlet(ctx: SessionContext, input: OutletInput) {
  return ctx.db.outlet.create({ data: { organizationId: ctx.orgId, ...input } });
}

export async function updateOutlet(
  ctx: SessionContext,
  outletId: string,
  input: Partial<OutletInput> & { active?: boolean },
) {
  const { count } = await ctx.db.outlet.updateMany({
    where: { id: outletId, organizationId: ctx.orgId },
    data: input,
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Outlet not found.");
}

export async function listUsers(ctx: SessionContext) {
  return ctx.db.user.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      outletId: true,
      active: true,
      // Never the hashes.
    },
  });
}

export interface UserCreateInput {
  name: string;
  role: Role;
  outletId?: string;
  email?: string;
  password?: string;
  pin?: string;
}

export async function createUser(ctx: SessionContext, input: UserCreateInput) {
  let outletId: string | null = null;
  if (input.role !== "owner") {
    const outlet = await ctx.db.outlet.findFirst({
      where: { id: input.outletId ?? ctx.outletId, organizationId: ctx.orgId },
      select: { id: true },
    });
    if (!outlet) throw new PosError("NOT_FOUND", "Outlet not found.");
    outletId = outlet.id;
  }

  return ctx.db.user.create({
    data: {
      organizationId: ctx.orgId,
      outletId,
      name: input.name,
      role: input.role,
      email: input.email?.toLowerCase().trim(),
      passwordHash: input.password ? hashSecret(input.password) : null,
      pinHash: input.pin ? hashSecret(input.pin) : null,
    },
    select: { id: true, name: true, role: true, outletId: true, email: true, active: true },
  });
}

export async function updateUser(
  ctx: SessionContext,
  userId: string,
  input: { name?: string; active?: boolean; password?: string; pin?: string; outletId?: string },
) {
  const target = await ctx.db.user.findFirst({
    where: { id: userId, organizationId: ctx.orgId },
    select: { id: true, role: true },
  });
  if (!target) throw new PosError("NOT_FOUND", "User not found.");
  // The last owner cannot deactivate themself and lock the org out.
  if (target.role === "owner" && input.active === false) {
    const owners = await ctx.db.user.count({
      where: { organizationId: ctx.orgId, role: "owner", active: true },
    });
    if (owners <= 1) throw new PosError("VALIDATION", "Can't deactivate the only owner.");
  }

  if (input.outletId) {
    const outlet = await ctx.db.outlet.findFirst({
      where: { id: input.outletId, organizationId: ctx.orgId },
      select: { id: true },
    });
    if (!outlet) throw new PosError("NOT_FOUND", "Outlet not found.");
  }

  await ctx.db.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.outletId !== undefined ? { outletId: input.outletId } : {}),
      ...(input.password ? { passwordHash: hashSecret(input.password) } : {}),
      ...(input.pin ? { pinHash: hashSecret(input.pin) } : {}),
    },
  });
}
